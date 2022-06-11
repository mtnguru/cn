#include "ArduinoJson.h"

char msg[200];
void setup() {
  // put your setup code here, to run once:
  // strcpy(msg, "{\"dude\":\"zilla\",\"cool\":\"stuff\"}");
  Serial.begin(115200);
  Serial.println();
  Serial.println();
  Serial.println("Start program");
  
  StaticJsonDocument<200> doc;
  doc["dude"] = "dudezilla";
  doc["cool"] = "stuff";
  JsonArray doc2 = doc.createNestedArray("doc2");
  doc2.add(93);
  doc2.add("zowie");

  char out[200];
  serializeJson(doc, out);
  Serial.print("out: ");
  Serial.println(out);

  DeserializationError error = deserializeJson(doc, out);
  const char* dude = doc["dude"];
  const char* num = doc["doc2"][1];
  Serial.print("Dude: ");
  Serial.println(dude);
  Serial.print("num: ");
  Serial.println(num);
  Serial.println();
  
}

void loop() {
  // put your main code here, to run repeatedly:

}
