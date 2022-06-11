/*
 * Connect to Nacho at th cabin.
 * 
 */

#include "max6675.h"
#include <ESP8266WiFi.h>
#include <ArduinoJson.h>

int thermoDO  = 2;
int thermoCS  = 4;
int thermoCLK = 5;

MAX6675 thermocouple(thermoCLK, thermoCS, thermoDO);

void mqttSend() {
  StaticJsonDocument<256> doc;
  doc["sensor"] = "gps";
  doc["time"] = 1351824120;

  // Add an array.
  //
  JsonArray data = doc.createNestedArray("data");
  data.add(48.756080);
  data.add(2.302038);
  //doc["data"]=data;
  
  // Generate the minified JSON and send it to the Serial port.
  char out[128];
  int b =serializeJson(doc, out);
  Serial.print("bytes = ");
  Serial.println(b,DEC);
  Serial.println(out);
//boolean rc = mqttClient.publish("arduino-test", out);
}

IPAddress connectWiFi () {
  Serial.println();
  Serial.print("Connect WiFi");
  WiFi.begin("NachoWiFi", "Nemoy1701"); // 2.4 GHz on ASUS Nacho
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println();

  Serial.print("Connected, IP address: ");
  Serial.println(WiFi.localIP());
  return WiFi.localIP();
}


void setup()
{
  IPAddress ip;
  
  Serial.begin(115200);
  Serial.println();
  Serial.println();

  ip = connectWiFi();
  mqttConnect();
  mqttSend();
  
  ip = connectWiFi();

  Serial.println("MAX6675 test");
  // wait for MAX chip to stabilize
  delay(1000);
}

void loop() {
  // basic readout test, just print the current temp
  
//Serial.print(" C = "); 
//Serial.println(thermocouple.readCelsius());
  Serial.print(" F = ");
  Serial.println(thermocouple.readFahrenheit());
 
  // For the MAX6675 to update, you must delay AT LEAST 250ms between reads!
  delay(1000);
}

  
