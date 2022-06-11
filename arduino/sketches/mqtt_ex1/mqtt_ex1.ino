/*
 Basic MQTT example with Authentication

  - connects to an MQTT server, providing username
    and password
  - publishes "hello world" to the topic "outTopic"
  - subscribes to the topic "inTopic"
*/

//#include <SPI.h>
//#include <Ethernet.h>
#include <PubSubClient.h>

// Update these with values suitable for your network.
byte mac[]    = {  0xDE, 0xED, 0xBA, 0xFE, 0xFE, 0xED };
IPAddress ip(172,16,45,40);        // arduino
IPAddress server(172, 16, 45, 7);  // merlin

void callback(char* topic, byte* payload, unsigned int length) {
  // handle message arrived
}

//EthernetClient ethClient;
//PubSubClient client(server, 1883, callback, ethClient);

void setup()
{
//Ethernet.begin(mac, ip);
  // Note - the default maximum packet size is 128 bytes. If the
  // combined length of clientId, username and password exceed this use the
  // following to increase the buffer size:
  // client.setBufferSize(255);
  
//if (client.connect("arduinoClient", "data", "datawp")) {
//  client.publish("outTopic","hello world");
//  client.subscribe("inTopic");
//}
}

void loop()
{
//client.loop();
}
