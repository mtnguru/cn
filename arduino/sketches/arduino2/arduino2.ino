 /* 
  *  Arduino WiFi program - arduino.ino
    - send and receive json messages with MQTT client
       - obtain configuration information from LabTime program
       - publish sensor values on change
       - subscribe to output messages and set channel output accordingly
*/

#include "max6675.h"

const char *program = "arduino.js";
boolean res = true;   // Error results

boolean haveConfig = false;

char clientName[18];

enum outputsE    {OUT_NAME, OUT_TYPE, OUT_TOPIC, OUT_CHANNEL};
enum outputTypeE {OUT_LED, OUT_DIGITAL, OUT_LCD};
struct outputS {
  char metric[40];
  outputTypeE type;
  char channel[12];
  char value[80];
};  
const int outputsMax = 5;
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
const int inputsMax = 5;
inputS inputsA[inputsMax];
int inputsN = 0;

const int errorMsgSize = 80;
char errorMsg[errorMsgSize];
const int logMsgSize = 80;
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

const char* mqttIp = "172.16.45.7";  // merlin
const char* mqttUser = "data";
const char* mqttPassword = "datawp";

char mqttOutputSub[40];
char mqttAdminSub[40];
char mqttNotifyPub[40];
char mqttErrorPub[40];
char mqttInputPub[40];
char mqttDebugPub[40];
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



void wifiInit() {
  Serial.println();
  Serial.println();
  Serial.print("Connection to wifi...");
  delay(10);

  WiFi.begin(wifiSsid, wifiPassword);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");

  randomSeed(micros());  // Why?

  wifiIP = WiFi.localIP().toString();
  
  Serial.println((String)"\n   localIP: " + wifiIP);
}

struct outputS *findOutputMetric(const char *metric) {
  for (int i = 0; i < outputsN; i++) {
    if (strcmp(outputsA[i].metric,metric) == 0){
      return &outputsA[i];
    }
  }
  return NULL;
}

void getInfluxMetric(const char *payload, char *metric) {
//Serial.println((String)"getInfluxMetric - enter" + payload);
  const char tok[] = ",";
  int b = strcspn (payload, "=");
  int e = strcspn(&payload[b+1], " ,");
  strncpy(metric,&payload[b+1],e);
  metric[e] = '\0';
//Serial.println((String)"Found: " + b + " " + e + "  metric " + metric);  
  return;
}

void getInfluxValue(const char *payload, char *value) {
//Serial.println((String)"getInfluxValue - enter" + payload);
  const char tok[] = ",";
  int a = strcspn (payload, " ");
  int b = strcspn (&payload[a+1], "=");
  strcpy(value,&payload[a+b+2]);
//Serial.println((String)"Found: " + a + ":" + b + "  value: " + value);  
  return;
}

void(* resetFunc) (void) = 0; //declare reset function @ address 0

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  int level = 0;
  char *f = "mqttCallback";
  logit(f, "enter", NULL, level);

  char paystr[1000];
  strncpy(paystr, (char *)payload, length);
  paystr[length] = '\0';
  Serial.println((String)"          <- " + topic + " " + length + "  " + paystr + "/n/n");
  if (strcmp(topic, mqttConfigSub) == 0) {    // Configuration messages
    setConfig(topic, paystr, level);
  } else if (strstr(topic, "/admin/") != NULL) {  // Administration
    Serial.println((String)"Inside the admin section");
    char action[20];
    int num = gettoken(topic, action, 2);
    if (strcmp(action, "reset") == 0) {
      Serial.println((String)"   reset the arduino");
      resetFunc();
    }
  } else if (strcmp(topic, mqttOutputSub) == 0) {  // Request Output from LabTime
    logit(f,"output from LabTime - requesting action",NULL,level);
    // influx line protocol, 2nd field is required to be metric
    char metric[40];
    char tmp[40];
    strcpy(tmp,paystr);
    logit(f,"get influx metric ",tmp,level);
    getInfluxMetric(tmp, metric);
//  Serial.println((String)' metric ' + metric);

    const outputS *output = findOutputMetric(metric);

    if (output == NULL) {
      Serial.println((String)"Cannot find output metric " + metric);
    }
    const int channel = atoi(output->channel);

    char value[40];
    strcpy(tmp,paystr);
    getInfluxValue(tmp,value);
//  Serial.println((String)"    received " + output->type + "  " + channel + "  " + value + "  LED_BUILTIN " + LED_BUILTIN);
    const int channelType = output->type;
//  Serial.println((String)"====== dude " + channelType);
    switch (channelType) {
      case OUT_LED:
        break;
      case OUT_DIGITAL:
        if (value[0] == '1') {
          Serial.println("   digital - set true");
          digitalWrite(channel,HIGH);
        } else if (value[0] == '0') {
          Serial.println("   digital - set false");
          digitalWrite(channel,LOW);
        } else {        
          Serial.println("   digital - unknown state");
        }
        break;
      case OUT_LCD:
        break;
    }
  }

//logit(f, "exit", NULL, level);
}

void reqConfig(int level) {
  level++;
  char *f = "reqConfig";
  logit(f, "enter", NULL, level);

  StaticJsonDocument<jsonDocSize> jsonDoc;
  char jsonStr[jsonStrSize];
  jsonDoc["type"] = "config";
  jsonDoc["ip"] = wifiIP;
  serializeJson(jsonDoc, jsonStr);

  res = mqttClient.publish(mqttConfigPub, jsonStr);
  if (!res) {
    Serial.println("Error publishing request in reqConfig");
  }
  logit(f, "exit", NULL, level);
}

void setConfig(char *topic, char *payload, int level) {
  level++;
  char *f = "setConfig";
  logit(f, "enter", topic, level);

  DeserializationError err = deserializeJson(jsonDoc, payload);
  if (err) {
    snprintf (errorMsg, errorMsgSize, "ERROR: deserializationJson - %s", err.c_str());
    pubErrorMsg(f, errorMsg, 0, level);
  }

  strcpy(clientName, jsonDoc["clientName"]);
  Serial.println((String)"diddde3ed " + clientName);

  ///////////// Set MQTT topics
  strcpy(mqttOutputSub, jsonDoc["subscribeTopics"]["output"]);
  strcpy(mqttAdminSub,  jsonDoc["subscribeTopics"]["admin"]);

  strcpy(mqttInputPub,  "lab1/input/post/");
  strcat(mqttInputPub,  clientName);
  
  strcpy(mqttErrorPub, "lab1/error/post/");
  strcat(mqttErrorPub,  clientName);
  
  strcpy(mqttDebugPub, "lab1/debug/post/");
  strcat(mqttDebugPub,  clientName);
  
  logit(f, "subscribe mqttOutputSub: ", mqttOutputSub, level);
  res = mqttClient.subscribe(mqttOutputSub);
  if (!res) {
    pubErrorMsg(f, "subscribe mqttOutputSub", res, level);
  }
  
  logit(f, "subscribe mqttAdminSub: ", mqttAdminSub, level);
  res = mqttClient.subscribe(mqttAdminSub);
  if (!res) {
    pubErrorMsg(f, "subscribei mqttAdminSub ", res, level);
  }

  // loop through inputs, initialize inputsA[]
  //    inputs are outgoing, they are inputs to the controller
  Serial.println("\nInputs");
  JsonObject rootInput = jsonDoc["inputs"].as<JsonObject>();
  inputsN = 0;
  for (JsonPair input : rootInput) {
    const char *metric = input.key().c_str();
    strcpy(inputsA[inputsN].metric,metric);
    Serial.println((String)"   " + inputsA[inputsN].metric);

    // Copy device properties from json to internal array
    const char *type = jsonDoc["inputs"][metric]["type"];
    if (strcmp(type,"Button") == 0) {
      inputsA[inputsN].type     = IN_BUTTON;
    } else if (strcmp(type,"MAX6675") == 0) {
      inputsA[inputsN].type     = IN_MAX6675;
    } else {
      String msg = (String)"cannot find input type " + type;
      pubErrorMsg(f, msg, 0, level);
    }
//  strcpy(inputsA[inputsN].topic, jsonDoc["inputs"][metric]["topic"]);
    strcpy(inputsA[inputsN].tags,   jsonDoc["inputs"][metric]["tags"]);
    strcpy(inputsA[inputsN].channels,jsonDoc["inputs"][metric]["channels"]);
    
    //  JsonObject rootProperty = input.value().as<JsonObject>();
    //  for (JsonPair property : rootProperty) {
    //    const char *key = property.key().c_str();
    //    Serial.println((String)"      Property " + property.key().c_str() + " - " + property.value().as<char *>());
    //    char *tags = jsonDoc["inputs"][key]["tags"];
    //    Serial.println((String)"         tags " + tags);
    //  }
    inputsN++;
  }
  
  // loop through outputs - initialize outputsA[]

  //   outputs are incoming to this program - they are outputs of the controller
  Serial.println("\nOutputs");
  JsonObject rootOutput = jsonDoc["outputs"].as<JsonObject>();
  outputsN = 0;
  for (JsonPair output : rootOutput) {
    const char *metric = output.key().c_str();
    strcpy(outputsA[outputsN].metric,metric);
    Serial.println((String)"   " + outputsA[outputsN].metric);

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
      String msg = (String)"cannot find output type " + type;
      pubErrorMsg(f, msg, 0, level);
    }
    
    strcpy(outputsA[outputsN].channel,jsonDoc["outputs"][metric]["channel"]);
    Serial.println((String)"======== channel ====== " + outputsA[outputsN].channel); 
    
    outputsN++;
}

  Serial.println();

  haveConfig = true;

  logit(f, "exit", NULL, level);
}

void unsubscribeCallback(int level) {
  level++;
  char *f = "unsubscribeCallback";
  logit(f, "howdy", NULL, level);
}

void mqttReconnect(int level) {
  level++;
  char *f = "mqttReconnect";
  logit(f, "enter", NULL, level);
  while (!mqttClient.connected()) {
    logit(f, "Attempting MQTT connection...", NULL, level);
    if (mqttClient.connect(mqttClientId.c_str(), mqttUser, mqttPassword)) {
      logit(f, "connected", NULL, level);
      mqttClient.setBufferSize(1000);
//    res = mqttClient.publish("lab1/debug/post", "hello universe");
      
      if (!res) {
        pubErrorMsg(f, "publish", res, level);
      }
      
      logit(f,"mqttConfigSub ",mqttConfigSub,level);
      res = mqttClient.subscribe(mqttConfigSub);
      if (!res) {
        pubErrorMsg(f,"subscribe", res, level);
      }
  
      reqConfig(level);
      delay(2000);
    } else {
      Serial.println("Connection failed - trying again in 5 seconds");
      delay(5000);
    }
  }

  logit(f, "exit", NULL, level);
  //delay(2000);
}

void pubErrorMsg(char *func, String msg, bool res, int level) {
  level++;
  char *f = "pubErrorMsg";
  logit(f,"enter",NULL,level);
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

void logit(char *func, const char *msg, const char *more, int level) {
  if (more != NULL) {
    snprintf(logMsg, logMsgSize, "%.*s%s - %s - %s", level * 2, "             ", func, msg, more);
  } else {
    snprintf(logMsg, logMsgSize, "%.*s%s - %s", level * 2, "             ", func, msg);
  }
  Serial.println(logMsg);
}

void sampleInputs(int sampleNum) {
//Serial.println((String)"\nStart Sample " + sampleNum + "   " + inputsN);
  // Loop through the inputs, read value, and post to MQTT
  for (int i = 0; i < inputsN; i++) {
    inputS *input = &inputsA[i];
    switch (inputsA[i].type) {
      case IN_BUTTON:
        break;
      case IN_MAX6675:
        float temp = tc.readFahrenheit();
        snprintf(payload, payloadSize, "%s value=%g", input->tags, temp);
        Serial.println((String)"publish input: " + payload);
        
        mqttClient.publish(mqttInputPub, payload);
        break;
    }
  }
}

void setup() {
  int level = 0;
  
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
  int level = 0;
  char *f = "loop";
  //Serial.print("loop enter  connected - ");
  //Serial.println(mqttClient.connected());
  if (!mqttClient.connected()) {
    Serial.println("\n\nDisconnected, attempt reconnect");
    mqttReconnect(level);
  }
  mqttClient.loop();
  if (haveConfig) {
    unsigned long now = millis();

    if (now - lastSample > sampleInterval) {
      lastSample = now;
      sampleInputs(++sampleNum);
    }
  } else {
    //  logit(f,"WARNING: Config not read",NULL, level);
  }
  //Serial.println("loop exit");
}
