 /*
  *  Arduino WiFi program - arduino.ino
    - send and receive json messages with MQTT client
       - obtain configuration information from CN program
       - publish sensor values on change
       - subscribe to CN output messages and set channel output accordingly
*/

const char *program = "arduino.js";
boolean res = true;   // Error results


boolean haveConfig = false;
boolean connected = false;
enum msgTypeE        { MA,   MI,   MO,   MN,   ME,   MW,   MD};
boolean msgFlags[] = {true, true, true, true, true, true, true};

char clientName[18];

enum outputsE    {OUT_NAME, OUT_TYPE, OUT_TOPIC, OUT_CHANNEL};
enum outputTypeE {OUT_LED, OUT_DIGITAL, OUT_LCD};
struct outputS {
  char metric[40];
  outputTypeE type;
  char channel[12];
  char value[80];
};
const int outputsMax = 3;
outputS outputsA[outputsMax];
int outputsN = 0;

enum inputsE    {IN_NAME, IN_TYPE, IN_TOPIC, IN_TAGS, IN_CHANNELS};
enum inputTypeE {IN_MAX6675, IN_BUTTON};
struct inputS {
  char metric[40];
  inputTypeE type;
  char topic[40];
  char tags[120];
  char channels[12];
};
const int inputsMax = 3;
inputS inputsA[inputsMax];
int inputsN = 0;

const int errorMsgSize = 80;
char errorMsg[errorMsgSize];
const int logMsgSize = 200;
char logMsg[logMsgSize];

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

//////////// Subscribe and publish topics
char mqttOutputSub[40];
char mqttAdminSub[40];
char mqttAdminPub[40];
char mqttErrorPub[40];
char mqttWarningPub[40];
char mqttInputPub[40];
char mqttDebugPub[40];
char mqttNotifyPub[40];
char mqttConfigSub[40];
char mqttConfigPub[40];

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
const int sampleInterval = 5000;
float lastTemp = 0;
MAX6675 tc(thermoCLK, thermoCS, thermoDO);

/////////////
unsigned long lastSample = 0;
int sampleNum = 0;

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
  wifiIP = WiFi.localIP().toString();
}

/**
 * findOutputMetric -
 *
 *
 */
struct outputS *findOutputMetric(const char *metric) {
  for (int i = 0; i < outputsN; i++) {
    if (strcmp(outputsA[i].metric,metric) == 0){
      return &outputsA[i];
    }
  }
  return NULL;
}

void getInfluxMetric(const char *payload, char *metric) {
  const char tok[] = ",";
  int b = strcspn (payload, "=");
  int e = strcspn(&payload[b+1], " ,");
  strncpy(metric,&payload[b+1],e);
  metric[e] = '\0';
  logit(MD,"getInfluxMetric","Found: ", metric);
  return;
}

void getInfluxValue(const char *payload, char *value) {
  const char tok[] = ",";
  int a = strcspn (payload, " ");
  int b = strcspn (&payload[a+1], "=");
  strcpy(value,&payload[a+b+2]);
  logit(MD,"getInfluxValue","Found: ", value);
  return;
}

void(* resetFunc) (void) = 0; //declare reset function @ address 0

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  char *f = "mqttCallback";
  logit(MD, f, "enter", NULL);

  char paystr[2000];
  strncpy(paystr, (char *)payload, length);
  paystr[length] = '\0';

  snprintf (logMsg, logMsgSize, "<---- Incoming message - %s - %d - %s", topic, length, paystr);
  logit(MN,f,logMsg,NULL);
  if (strcmp(topic, mqttConfigSub) == 0) {    // Configuration messages
    logit(MD,f,"  call setConfig",NULL);
    setConfig(topic, paystr);
  } else if (strstr(topic, "/admin/") != NULL) {  // Administration
    logit(MD,f,"Inside the admin section",NULL);
    char action[20];
    int num = gettoken(topic, action, 2);
    if (strcmp(action, "reset") == 0) {
      logit(MN,f,"   reset the arduino", NULL);
      resetFunc();
    }
  } else if (strcmp(topic, mqttOutputSub) == 0) {  // Request Output from CN
    logit(MD,f,"incoming control request - output",NULL);
    // influx line protocol, 2nd field is required to be metric
    char metric[40];
    char tmp[40];
    strcpy(tmp,paystr);
    logit(MD, f,"get influx metric ",tmp);
    getInfluxMetric(tmp, metric);
    const outputS *output = findOutputMetric(metric);
    if (output == NULL) {
      logit(ME,f,"Cannot find output metric ", metric);
      return;
    }
    const int channel = atoi(output->channel);

    char value[40];
    strcpy(tmp,paystr);
    getInfluxValue(tmp,value);
    switch (output->type) {
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
}

/**
 * reqConfig - request the configuration for this device
 *
 */
void reqConfig() {
  char *f = "reqConfig";
  logit(MD, f, "enter", NULL);

  char jsonStr[jsonStrSize];
  jsonDoc["type"] = "config";
  jsonDoc["ip"] = wifiIP;
  serializeJson(jsonDoc, jsonStr);

  res = mqttClient.publish(mqttConfigPub, jsonStr);
  if (!res) {
    logit(ME,f,"Error publishing request in reqConfig", NULL);
  }
  logit(MD, f, "exit", NULL);
}

void setConfig(char *topic, char *payload) {
  char *f = "setConfig";
  logit(MD, f, "enter", topic);

  DeserializationError err = deserializeJson(jsonDoc, payload);
  if (err) {
    snprintf (errorMsg, errorMsgSize, "ERROR: deserializationJson - %s", err.c_str());
    logit(MD, f, errorMsg, 0);
  }

  strcpy(clientName, jsonDoc["clientName"]);

  ///////////// Set MQTT topics
  strcpy(mqttOutputSub, jsonDoc["subscribeTopics"]["output"]);
  strcpy(mqttAdminSub,  jsonDoc["subscribeTopics"]["admin"]);
  strcpy(mqttAdminPub,  jsonDoc["subscribeTopics"]["admin"]);

  strcpy(mqttInputPub,  "lab1/input/influx/");
  strcat(mqttInputPub,  clientName);
  strcat(mqttInputPub,  "/lab1_influx");

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

  // loop through inputs, initialize inputsA[]
  //    inputs are outgoing, they are inputs to the controller
  logit(MD,f,"Inputs ",NULL);
  JsonObject rootInput = jsonDoc["inputs"].as<JsonObject>();
  inputsN = 0;
  for (JsonPair input : rootInput) {
    const char *metric = input.key().c_str();
    strcpy(inputsA[inputsN].metric,metric);
    logit(MD,f,"   InputOutputs ",inputsA[inputsN].metric);

    // Copy device properties from json to internal array
    const char *type = jsonDoc["inputs"][metric]["type"];
    if (strcmp(type,"Button") == 0) {
      inputsA[inputsN].type     = IN_BUTTON;
    } else if (strcmp(type,"MAX6675") == 0) {
      inputsA[inputsN].type     = IN_MAX6675;
    } else {
      logit(MD, f, "Cannot find input type: ", type);
    }
    strcpy(inputsA[inputsN].tags,   jsonDoc["inputs"][metric]["tags"]);
    strcpy(inputsA[inputsN].channels,jsonDoc["inputs"][metric]["channels"]);
    inputsN++;
  }

  // loop through outputs - initialize outputsA[] - input control signal
  logit(MD,f,"Outputs",NULL);
  JsonObject rootOutput = jsonDoc["outputs"].as<JsonObject>();
  outputsN = 0;
  for (JsonPair output : rootOutput) {
    const char *metric = output.key().c_str();
    strcpy(outputsA[outputsN].metric,metric);
    logit(MD,f,"\nOutputs ",outputsA[outputsN].metric);

    // Copy device properties from json to internal array
    const char *type = jsonDoc["outputs"][metric]["type"];
    const char *channel = jsonDoc["outputs"][metric]["type"];
    pinMode(atoi(channel), OUTPUT);
    pinMode(LED_BUILTIN, OUTPUT);
    if (strcmp(type,"OUT_LED") == 0) {
      outputsA[outputsN].type = OUT_LED;
    } else if (strcmp(type,"LCD") == 0) {
      outputsA[outputsN].type = OUT_LCD;
    } else if (strcmp(type,"digital") == 0) {
      outputsA[outputsN].type = OUT_DIGITAL;
    } else {
      logit(MD, f, "Cannot find output type:", type);
    }

    strcpy(outputsA[outputsN].channel,jsonDoc["outputs"][metric]["channel"]);
    logit(MD,f,"channel ",  outputsA[outputsN].channel);

    outputsN++;
  }
  haveConfig = true;
  logit(MD, f, "exit", NULL);
}

void unsubscribeCallback() {
  char *f = "unsubscribeCallback";
  logit(MD, f, "howdy", NULL);
}

void mqttReconnect() {
  char *f = "mqttReconnect";
//logit(MD, f, "enter", NULL);
  while (!mqttClient.connected()) {
    logit(MD, f, "Attempting MQTT connection...", NULL);
    if (mqttClient.connect(mqttClientId.c_str(), mqttUser, mqttPassword)) {
      logit(MD, f, "connected", NULL);
      mqttClient.setBufferSize(1000);

//    logit(MD, f,"mqttConfigSub ",mqttConfigSub);
      res = mqttClient.subscribe(mqttConfigSub);
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

  logit(MD, f, "exit", NULL);
  //delay(2000);
}

/* json logit - do I want this?
void logit(char *func, String msg, bool res) {
  char *f = "logit";
  logit(MD, f,"enter",NULL);
  StaticJsonDocument<jsonDocSize> jsonDoc;
  char jsonStr[jsonStrSize];
  jsonDoc["type"] = "ERROR";
  jsonDoc["clientName"] = clientName;
  jsonDoc["program"] = program;
  jsonDoc["function"] = func;
  jsonDoc["msg"] = msg;
  serializeJson(jsonDoc, jsonStr);

  if (mqttClient.connected()) {
    //mqttClient.publish(mqttErrorPub, jsonStr);
  }

  snprintf(errorMsg, errorMsgSize, "ERROR: %s:%s %d- %s", program, func, res, msg);
  Serial.println(errorMsg);
}
*/

void logit(msgTypeE msgType, char *func, const char *msg, const char *more) {
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
    snprintf(logMsg, logMsgSize, "%7s - %s - %s - %s", typeName, func, msg, more);
  } else {
    snprintf(logMsg, logMsgSize, "%7s - %s - %s", typeName, func, msg);
  }
  Serial.println(logMsg);

  /* -- this crashes when I publish - am I publishing too quickly?
  Serial.println((String)"logit check connected " + connected);
  if (mqttClient.connected()) {
    Serial.println((String)"logit connected " + connected);
    char *topic;
    Serial.println((String)"call publish " + topic);
//  mqttClient.publish(topic, logMsg);
  }
  */
}

void sampleInputs(int sampleNum) {
  // Loop through the inputs, read value, and post to MQTT
  char *f = "sampleInputs";
  for (int i = 0; i < inputsN; i++) {
    inputS *input = &inputsA[i];
    switch (inputsA[i].type) {
      case IN_BUTTON:
        break;
      case IN_MAX6675:
        float temp = tc.readFahrenheit();
        snprintf(payload, payloadSize, "%s value=%g", input->tags, temp);
        logit(MN,f,"publish input: ", payload);
        mqttClient.publish(mqttInputPub, payload);
        break;
    }
  }
}

void setup() {
  randomSeed(micros());
  mqttClientId = "arduino_" + String(random(0xffff), HEX);

  Serial.begin(115200);
  wifiInit();

  strcpy(mqttConfigSub, "lab1/config/post/");
  strcat(mqttConfigSub,  wifiIP.c_str());

  strcpy(mqttConfigPub, "lab1/config/client/");
  strcat(mqttConfigPub,  wifiIP.c_str());

  mqttClient.setServer(mqttIp, 1883);
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