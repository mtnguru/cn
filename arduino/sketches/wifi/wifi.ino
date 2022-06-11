/*
 Basic ESP8266 MQTT example
 This sketch demonstrates the capabilities of the pubsub library in combination
 with the ESP8266 board/library.
 It connects to an MQTT server then:
  - publishes "hello world" to the topic "outTopic" every two seconds
  - subscribes to the topic "inTopic", printing out any messages
    it receives. NB - it assumes the received payloads are strings not binary
  - If the first character of the topic "inTopic" is an 1, switch ON the ESP Led,
    else switch it off
 It will reconnect to the server if the connection is lost using a blocking
 reconnect function. See the 'mqtt_reconnect_nonblocking' example for how to
 achieve the same result without blocking the main loop.
 To install the ESP8266 board, (using Arduino 1.6.4+):
  - Add the following 3rd party board manager under "File -> Preferences -> Additional Boards Manager URLs":
       http://arduino.esp8266.com/stable/package_esp8266com_index.json
  - Open the "Tools -> Board -> Board Manager" and click install for the ESP8266"
  - Select your ESP8266 in "Tools -> Board"
*/


///////////// Ethernet and MQTT client
#include <ESP8266WiFi.h>
#include <PubSubClient.h>

WiFiClient espClient;
PubSubClient client(espClient);

const char* wifiSsid = "NachoWiFi";
const char* wifiPassword = "Nemoy1701";

const char* mqttIp = "172.16.45.7";  // merlin
const char* mqttUser = "data";
const char* mqttPassword = "datawp";
const char* mqttTopicPub = "edge/input/arduino2";
const char* mqttTopicSub = "edge/output/arduino2";

///////////// MAX6675 thermocouple 
#include "max6675.h"
const int thermoDO  = 2;
const int thermoCS  = 4;
const int thermoCLK = 5;
const int sampleInterval = 3000;
float lastTemp = 0;
MAX6675 thermocouple(thermoCLK, thermoCS, thermoDO);


/////////////
unsigned long lastSample = 0;
const int MSG_BUFFER_SIZE = 200;
char msg[MSG_BUFFER_SIZE];
int sampleNum = 0;

void wifiInit() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(wifiSsid);

  WiFi.begin(wifiSsid, wifiPassword);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  randomSeed(micros());  // Why?

  Serial.println("");
  Serial.print("WiFi connected - ");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();

  // Switch on the LED if an 1 was received as first character
  if ((char)payload[0] == '1') {
    digitalWrite(BUILTIN_LED, LOW);   // Turn the LED on (Note that LOW is the voltage level
    // but actually the LED is on; this is because
    // it is active low on the ESP-01)
  } else {
    digitalWrite(BUILTIN_LED, HIGH);  // Turn the LED off by making the voltage HIGH
  }
}

void getConfig() {
  // Send request for config
  // Wait for config
  //   Read in config
}

void mqttReconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Create a random client ID
    String clientId = "ESP8266Client-";
    clientId += String(random(0xffff), HEX);
    // Attempt to connect
    int ret = client.connect(clientId.c_str(), mqttUser, mqttPassword);
    Serial.print("  state: ");
    Serial.println(ret);

    if (client.connect(clientId.c_str(), mqttUser, mqttPassword)) {
      Serial.println("connected");
      // Once connected, publish an announcement...
      client.publish(mqttTopicPub, "hello world");
      // ... and resubscribe
      client.subscribe(mqttTopicSub);
      getConfig();
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

void setup() {
  pinMode(BUILTIN_LED, OUTPUT);     // Initialize the BUILTIN_LED pin as an output
  Serial.begin(115200);
  wifiInit();
  client.setServer(mqttIp, 1883);
  client.setCallback(mqttCallback);
}

void loop() {

  if (!client.connected()) {
    mqttReconnect();
  }
  client.loop();

  unsigned long now = millis();
  if (now - lastSample > sampleInterval) {
    lastSample = now;
    ++sampleNum;
    float temp = thermocouple.readFahrenheit();
    
    if (lastTemp != temp) {
//    lastTemp = temp;
      snprintf (msg, MSG_BUFFER_SIZE, "C,Metric=I_Cabin_K_Desk_C,Position=Desk,Device=K value=%f", temp);
      Serial.print(" -> ");
      Serial.print(mqttTopicPub);
      Serial.print(" ");
      Serial.println(msg);
      client.publish(mqttTopicPub, msg);
      client.publish(mqttTopicPub, "hello world");
    }
  }
}
               
