// this example is public domain. enjoy! https://learn.adafruit.com/thermocouple/

#include "max6675.h"

int thermoDO  = 2;
int thermoCS  = 4;
int thermoCLK = 5;

MAX6675 tc(thermoCLK, thermoCS, thermoDO);

void setup() {

//tccP = new MAX6675;
  
//(*tccP)(thermoCLK, thermoCS, thermoDO);  
  
  Serial.begin(115200);
//MAX6675 tc(thermoCLK, thermoCS, thermoDO);

  Serial.println("MAX6675 test");
  // wait for MAX chip to stabilize
  delay(1000);
}

void loop() {
  // basic readout test, just print the current temp
  
//Serial.print("   C = "); 
//Serial.println(tc.readCelsius());
  Serial.print("   F = ");
  Serial.println(tc.readFahrenheit());
  
  // For the MAX6675 to update, you must delay AT LEAST 250ms between reads!
  delay(1000);
}
