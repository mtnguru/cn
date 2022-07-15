 /*
  *  Arduino WiFi program - arduino.ino
    - send and receive json messages with MQTT client
       - obtain configuration information from LabTime program
       - publish sensor values on change
       - subscribe to output messages and set channel output accordingly
*/

const char *program = "arduino.js";
boolean res = true;   // Error results

boolean haveConfig = false;
boolean connected = false;
enum msgTypeE        { MA,   MI,   MO,   MN,   ME,   MW,   MD};
boolean msgFlags[] = {true, true, true, true, true, true, true};

const int msgSize = 240;
char msg[msgSize];

char clientName[18];

enum outputTypeE {OUT_LED, OUT_DIGITAL, OUT_LCD};
struct outputS {
  outputTypeE type;
  char channel[12];
  char tags[200];
  char value[80];
  boolean have;
};

enum inputTypeE {IN_MAX6675, IN_BUTTON};
struct inputS {
  inputTypeE type;
  char topic[40];
  char tags[200];
  char channels[12];
  boolean have;
};

struct metricS {
  char metricName[40];
  outputS output;
  inputS input;
};
const int metricsMax = 5;
metricS metricsA[metricsMax];
int metricsN = 0;

///////////// WiFi
#include <ESP8266WiFi.h>
WiFiClient espClient;
const char* wifiSsid = "NachoWiFi";
const char* wifiPassword = "Nemoy1701";
String wifiIP;

///////////// MQTT client
#include <PubSubClient.h>
PubSubClient mqttClient(espClient);
String mqttClientId;

///////////// Mqtt server credentials
const char* mqttIp = "172.16.45.7";  // merlin
const char* mqttUser = "data";
const char* mqttPassword = "datawp";
const int mqttPort = 1883;

//////////// Subscribe and publish topics
char mqttOutputSub[40];
char mqttAdminSub[40];
char mqttAdminPub[40];
char mqttErrorPub[40];
char mqttWarningPub[40];
char mqttInputPub[40];
char mqttDebugPub[40];
char mqttNotifyPub[40];

const int payloadSize = 200;
char payload[payloadSize];

///////////// JSON
#include "ArduinoJson.h"
const int jsonDocSize = 5000;
const int jsonStrSize = 1000;
StaticJsonDocument<jsonDocSize> jsonDoc;

///////////// MAX6675 thermocouple
#include "max6675.h"
const int thermoDO  = 2;
const int thermoCS  = 4;
const int thermoCLK = 5;
int sampleInterval = 5000;
float lastTemp = 0;
MAX6675 tc(thermoCLK, thermoCS, thermoDO);

/////////////
unsigned long lastSample = 0;
int sampleNum = 0;

#ifdef __arm__
// should use uinstd.h to define sbrk but Due causes a conflict
extern "C" char* sbrk(int incr);
#else  // __ARM__
extern char *__brkval;
#endif  // __arm__

String freeMemory() {
  const char *f = "freeMemory";
  long  fh = ESP.getFreeHeap();
  char  fhc[20];

  ltoa(fh, fhc, 10);
  String freeHeap = String(fhc);
  Serial.println((String)"Free memory " + freeHeap);
  return freeHeap;
}

char* lowerCase (char* str) {
  char* s = str;
  while (*str != '\0') { // not the end of the string
    if (*str >= 'A' && *str <= 'Z') {
      *str = *str + 32;
    }
    ++ str;
  }
  return s;
}

void logit(msgTypeE msgType, const char *func, const char *content, const char *more) {
  if (!msgFlags[msgType]) return;   // If logging is turned off for this message type return.

  char *typeName;
  char *topic;
  switch (msgType) {
    case MI: typeName = "Input";   topic = mqttInputPub;   break;
    case MD: typeName = "Debug";   topic = mqttDebugPub;   break;
    case MN: typeName = "Notify";  topic = mqttNotifyPub;  break;
    case MW: typeName = "Warning"; topic = mqttWarningPub; break;
    case ME: typeName = "Error";   topic = mqttErrorPub;   break;
    case MA: typeName = "Admin";   topic = mqttAdminPub;   break;
    default: typeName = "Unknown"; topic = mqttErrorPub;   break;
  }

  if (more != NULL) {
    snprintf(msg, msgSize, "%7s - %s - %s - %s", typeName, func, content, more);
  } else {
    snprintf(msg, msgSize, "%7s - %s - %s", typeName, func, content);
  }
  Serial.println(msg);

  /* -- this crashes when I publish - am I publishing too quickly?
  Serial.println((String)"logit check connected " + connected);
  if (mqttClient.connected()) {
    Serial.println((String)"logit connected " + connected);
    char *topic;
    Serial.println((String)"call publish " + topic);
//  mqttClient.publish(topic, msg);
  }
  */
}

/**
 * gettoken - extract the nth field using '/' for delimeter
 */
int gettoken(char *str, char *token, int pos) {
  const char del = '/';
  int lenStr = strlen(str);

  token[0] = '\0';
  int lenToken = -1;

  int f = 0;
  bool infld = (pos == 0) ? true : false;
  if (str[0] == del && infld) {
    token[lenToken] = '\0';
    return lenToken + 1;
  }
  for (int i = 0; i < lenStr; i++) {
    if (str[i] == del) {
      f++;
      if (infld) {
        token[lenToken] == '\0';
        return lenToken+1;
      } else if (f == pos) {
        infld = true;
      }
    } else {
      if (infld) {
        token[++lenToken] = str[i];
        token[lenToken + 1] = '\0';
      }
    }
  }

  if (infld) {
    token[++lenToken + 1] = '\0';
    return lenToken;
  } else {
    return lenToken;
  }
}

/**
 * wifiInit - Initialize the wifi, get IP
 */
void wifiInit() {
  Serial.println();
  Serial.println();
  Serial.print("Connecting to wifi ");
  delay(10);

  WiFi.begin(wifiSsid, wifiPassword);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println((String)"\n   localIP: " + wifiIP);

  randomSeed(micros());  // Why?
  WiFi.setSleepMode(WIFI_NONE_SLEEP);
  wifiIP = WiFi.localIP().toString();
  Serial.println((String)"\n   localIP: " + wifiIP);
}

/**
 * findMetric()
 *
 * Given a metric name, look for it in metricsA[n].metric
 */
struct metricS *findMetric(const char *metricName) {
  const char *f = "findMetric";
  char name[40];
  strcpy(name,metricName);
  lowerCase(name);
  for (int m = 0; m < metricsN; m++) {
    if (strcmp(metricsA[m].metricName,name) == 0){
      logit(MD,f,"Metric found",metricName);

      return &metricsA[m];
    }
  }
  logit(ME,f,"Metric not found",metricName);
  return NULL;
}

/**
 * getInfluxMetric - Search an influx line for the Metric field
 * Assumed to be the 2nd field in the line.
 */
void getInfluxMetric(const char *payload, char *metric) {
  const char tok[] = ",";
  int b = strcspn (payload, "=");
  int e = strcspn(&payload[b+1], " ,");
  strncpy(metric,&payload[b+1],e);
  metric[e] = '\0';
  logit(MD,"getInfluxMetric","Found: ", metric);
  return;
}

/**
 * getInfluxValue() - get the value from a line of Influx line protocol
 */
void getInfluxValue(const char *payload, char *value) {
  const char tok[] = ",";
  int a = strcspn (payload, " ");
  int b = strcspn (&payload[a+1], "=");
  strcpy(value,&payload[a+b+2]);
  logit(MD,"getInfluxValue","Found: ", value);
  return;
}

void processOutput (char *topic, char *paystr) {
  char *f = "processOutput";
  logit(MD,f,"incoming control request - output",NULL);
  // influx line protocol, 2nd field is required to be metric
  char metricName[40];
  char tmp[80];
  strcpy(tmp,paystr);
  logit(MD, f,"get influx metric ",tmp);
  getInfluxMetric(tmp, metricName);
  metricS *metric = findMetric(metricName);

  // Exit with error if cannot find the metric
  if (metric == NULL) {
    logit(ME,f,"Cannot find metric ", metricName);
    return;
  }

  // Exit with error if metric does not have an output
  if (metric->output.have == false) {
    logit(ME,f,"Metric does not have an output ", metricName);
    return;
  }



  const int channel = atoi(metric->output.channel);
  char value[40];
  strcpy(tmp,paystr);
  getInfluxValue(tmp,value);
  Serial.println((String)"Got Value " + value + " " + metric->output.type);
//snprintf(msg, msgSize, "output value %s  type %d", value, output->type);
//logit(MD,f,msg,NULL);
  switch (metric->output.type) {
    case OUT_LED:
      break;
    case OUT_DIGITAL:
      if (value[0] == '1') {
        logit(MD,f,"   digital channel - set true",NULL);
        digitalWrite(channel,HIGH);
      } else if (value[0] == '0') {
        logit(MD,f,"   digital channel - set false",NULL);
        digitalWrite(channel,LOW);
      } else {
        logit(MW,f,"Unknown digital value ",value);
      }
      break;
    case OUT_LCD:
      break;
  }
}

void(* resetFunc) (void) = 0; //declare reset function @ address 0

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  char *f = "mqttCallback";
  logit(MD, f, "enter", NULL);

  char paystr[2000];
  strncpy(paystr, (char *)payload, length);
  paystr[length] = '\0';

  snprintf (msg, msgSize, "<---- Incoming message - %s - %d - %s", topic, length, paystr);
  logit(MN,f,msg,NULL);

  // Receive the client config
  if (strcmp(topic, mqttAdminSub) == 0) {    // Configuration messages
    setConfig(topic, paystr);

  // Receive administration actions
  } else if (strstr(topic, "/admin/") != NULL) {  // Administration
    logit(MD,f,"Inside the admin section",NULL);
    char action[20];
    int num = gettoken(topic, action, 2);
    if (strcmp(action, "reset") == 0) {
      logit(MN,f,"   reset the arduino", NULL);
      resetFunc();
    }

  // Receive control (output) messages - output
  } else if (strcmp(topic, mqttOutputSub) == 0) {  // Request Output from LabTime
    processOutput(topic, paystr);
  }
}

/**
 * reqConfig - request the configuration for this device
 *
 */
void reqConfig() {
  char *f = "reqConfig";
  logit(MD, f, "enter", NULL);

//char jsonStr[jsonStrSize];
//jsonDoc["type"] = "config";
//jsonDoc["ip"] = wifiIP;
//serializeJson(jsonDoc, jsonStr);

  res = mqttClient.publish(mqttAdminPub, "");
  if (!res) {
    logit(ME,f,"Error publishing request in reqConfig", NULL);
  }
  logit(MD, f, "exit", NULL);
}

void setConfig(char *topic, char *payload) {
  char *f = "setConfig";
  logit(MD, f, "enter", topic);
  freeMemory();

  DeserializationError err = deserializeJson(jsonDoc, payload);
  logit(MD, f, "deserialized ",NULL);
  if (err) {
    snprintf (msg, msgSize, "ERROR: deserializationJson - %s", err.c_str());
    logit(MD, f, msg, 0);
  }

  logit(MD, f, "stuff ",NULL);
  strcpy(clientName, jsonDoc["clientName"]);
  sampleInterval = jsonDoc["sampleInterval"];
//char s[20];
//strcpy(s,jsonDoc["sampleInterval"]);
//logit(MD, f, "onward ",s);

  ///////////// Set MQTT topics
  strcpy(mqttOutputSub, jsonDoc["subscribeTopics"]["output"]);
  strcpy(mqttAdminSub,  jsonDoc["subscribeTopics"]["admin"]);
  strcpy(mqttAdminPub,  jsonDoc["subscribeTopics"]["admin"]);

  strcpy(mqttInputPub, jsonDoc["publishTopics"]["input"]);

  strcpy(mqttWarningPub, "lab1/warning/post/");
  strcat(mqttWarningPub,  clientName);

  strcpy(mqttErrorPub, "lab1/error/post/");
  strcat(mqttErrorPub,  clientName);

  strcpy(mqttDebugPub, "lab1/debug/post/");
  strcat(mqttDebugPub,  clientName);

  strcpy(mqttNotifyPub, "lab1/notify/post/");
  strcat(mqttNotifyPub,  clientName);

  logit(MD, f, "subscribe mqttOutputSub: ", mqttOutputSub);
  res = mqttClient.subscribe(mqttOutputSub);
  if (!res) {
    logit(ME, f, "subscribe mqttOutputSub", mqttOutputSub);
  }

  logit(MD, f, "subscribe mqttAdminSub: ", mqttAdminSub);
  res = mqttClient.subscribe(mqttAdminSub);
  if (!res) {
    logit(ME, f, "Error subscribing", NULL);
  }

  // loop through metrics, initialize metricsA[]
  //    inputs are outgoing, they are inputs to the controller
  logit(MD,f,"Metrics ",NULL);
  JsonObject rootMetric = jsonDoc["metrics"].as<JsonObject>();
  logit(MD,f,"object ",NULL);
  metricsN = 0;
  for (JsonPair metric : rootMetric) {
    logit(MD,f,"for loop ",NULL);
    const char *metricName = metric.key().c_str();
    strcpy(metricsA[metricsN].metricName,metricName);
//  strcpy(metricsA[metricsN].tags,      jsonDoc["metrics"][metricName]["tags"]);
    logit(MD,f,"   Metric ",metricsA[metricsN].metricName);

    logit(MD,f,"  do Input ",NULL);
    JsonObject inputObject = jsonDoc["metrics"][metricName]["input"];
    if (inputObject) {
      metricsA[metricsN].input.have = true;
      // Copy device properties from json to internal array
      const char *type = inputObject["type"];
      if (strcmp(type,"Button") == 0) {
        metricsA[metricsN].input.type  = IN_BUTTON;
      } else if (strcmp(type,"MAX6675") == 0) {
        metricsA[metricsN].input.type     = IN_MAX6675;
      } else {
        logit(MD, f, "Cannot find input type: ", type);
      }
      logit(MD,f,"   Input added ", metricName);
      strcpy(metricsA[metricsN].input.tags,      inputObject["tags"]);
      strcpy(metricsA[metricsN].input.channels,  inputObject["channels"]);
    } else {
      metricsA[metricsN].input.have = false;
    }

    logit(MD,f,"  do Output ",NULL);
    JsonObject outputObject = jsonDoc["metrics"][metricName]["output"];
    if (outputObject) {
      metricsA[metricsN].output.have = true;
      // Copy device properties from json to internal array
      const char *type = outputObject["type"];
      const char *channel = outputObject["channel"];
      pinMode(atoi(channel), OUTPUT);
      pinMode(LED_BUILTIN, OUTPUT);
      if (strcmp(type,"OUT_LED") == 0) {
        metricsA[metricsN].output.type  = OUT_LED;
      } else if (strcmp(type,"LCD") == 0) {
        metricsA[metricsN].output.type  = OUT_LCD;
      } else if (strcmp(type,"digital") == 0) {
        metricsA[metricsN].output.type  = OUT_DIGITAL;
      } else {
        logit(MD, f, "Cannot find outout type:", type);
      }

      strcpy(metricsA[metricsN].output.channel, outputObject["channel"]);
      logit(MD,f,"     channel ",  metricsA[metricsN].output.channel);
    } else {
      metricsA[metricsN].output.have = false;
    }
    metricsN++;
  }
  haveConfig = true;
  logit(MD, f, "exit", NULL);
}

void unsubscribeCallback() {
  char *f = "unsubscribeCallback";
  logit(MD, f, "howdy", NULL);
}

boolean connectit = true;
void mqttReconnect() {
  char *f = "mqttReconnect";
//logit(MD, f, "enter", NULL);
  freeMemory();
  int attempts = 0;
  while (!mqttClient.connected() && (attempts < 10)) {
    attempts++;
    Serial.println((String)"mqtt not connected - " + attempts);
    delay(10);
  }
  Serial.println((String)"Number of calls to mqttConnected() - " + attempts);
  if (attempts == 10) {
    while (!mqttClient.connected()) {
      logit(MD, f, "Attempting MQTT connection...", NULL);
      if (mqttClient.connect(mqttClientId.c_str(), mqttUser, mqttPassword)) {
        logit(MD, f, "connected", NULL);
        mqttClient.setBufferSize(2000);

        logit(MD,f,"Subscribe to ",mqttAdminSub);
        res = mqttClient.subscribe(mqttAdminSub);
        if (!res) {
          logit(ME, f,"Error subscribing", NULL);
        }
        reqConfig();
        delay(2000);
       } else {
        logit(ME,f,"Connection failed - trying again in 5 seconds",NULL);
        delay(5000);
      }
    }
  }

  logit(MD, f, "exit", NULL);
  //delay(2000);
}

void sampleInputs(int sampleNum) {
  // Loop through the inputs, read value, and post to MQTT
  char *f = "sampleInputs";
  for (int i = 0; i < metricsN; i++) {
    metricS *metric = &metricsA[i];
    if (metric->input.have) {
      switch (metric->input.type) {
        case IN_BUTTON:
          break;
        case IN_MAX6675:
          float temp = tc.readFahrenheit();
//        freeMemory();
          snprintf(payload, payloadSize, "%s value=%g", metric->input.tags, temp);
          logit(MN,f,"payload:", payload);
          mqttClient.publish(mqttInputPub, payload);
          break;
      }
    }
  }
}


void setup() {
  randomSeed(micros());
  mqttClientId = "arduino_" + String(random(0xffff), HEX);

  Serial.begin(115200);
  wifiInit();

  strcpy(mqttAdminSub, "lab1/admin/config/");
  strcat(mqttAdminSub,  wifiIP.c_str());

  strcpy(mqttAdminPub, "lab1/admin/configReq/");
  strcat(mqttAdminPub,  wifiIP.c_str());

  mqttClient.setServer(mqttIp, mqttPort);
  mqttClient.setCallback(mqttCallback);
}

void loop() {
  char *f = "loop";
  if (!mqttClient.connected()) {
    connected = false;
    Serial.println("\n\nDisconnected, attempt reconnect");
    mqttReconnect();
  }
  connected = true;
  mqttClient.loop();
  if (haveConfig) {
    unsigned long now = millis();

    if (now - lastSample > sampleInterval) {
      lastSample = now;
      sampleInputs(++sampleNum);
    }
  } else {
    //  logit(MD, f,"WARNING: Config not read",NULL);
  }
}