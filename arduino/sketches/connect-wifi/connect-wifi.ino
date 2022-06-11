/*
 * Connect to Nacho at th cabin.
 * 
*/
#include <ESP8266WiFi.h>
void connectWiFi () 
{
  Serial.begin(115200);
  Serial.println();

  WiFi.begin("NachoWiFi", "Nemoy1701"); // 2.4 GHz on ASUS Nacho
//WiFi.begin("Solvay", "taichi23");
//WiFi.begin("Verizon-SM-G930V-6ED7", "taichi23");

  Serial.print("Connecting");
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(1000);
    Serial.print(".");
  }
  Serial.println();

  Serial.print("Connected, IP address: ");
  Serial.println(WiFi.localIP());
}

void setup()
{
  connectWiFi();
}

void loop() {}
