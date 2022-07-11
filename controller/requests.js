var mqtt_lt = require('./utils/mqtt_lt');
var msg = require('./utils/msg');
require('dotenv').config();


/*
 * Processes a request for a devices configuration - device, inputs, outputs.
 */
const getHmiConfig = (ip) => {
  const f = 'requests:getHmiConfig - '
  console.log(f,'enter - ',ip);
  return global.config.hmi;
}

/*
 * Processes a request for a devices configuration - device, inputs, outputs.
 */
const getDeviceConfig = (ip) => {
  const f = 'requests:getDeviceConfig - '
  console.log(f,'enter - ',ip);
  let name;

  // Find the device
  let device;
  let client;
  for (name in global.config.devices) {

    let d = global.config.devices[name]
    if (d.ip == ip) {
      console.log(f,'ip found: ',ip);
      device = d;
      client = name;
    }
  }
  if (!device) {
    msg.pubErrorMsg(f, `IP address for device not found: ${ip}`)
  }

  // Find the inputs
  let inputs = {};
  for (name in global.config.inputs) {
    let input = global.config.inputs[name]
    if (input.client == client) {
      inputs[name] = input;
      console.log(f,'  add input: ', name)
    }
  }

  // Find the outputs
  let outputs = {};
  for (name in global.config.outputs) {
    let output = global.config.outputs[name]
    console.log(f,'  ----------- check output --------- ', name, '  ', client, '  ', output.client)
    if (output.client == client) {
      outputs[name] = output
      console.log(f,'  add output: ', name)
    }
  }

  let config = {client, device, inputs, outputs};
  console.log(f,'exit');
  return config;
}

/*
 * processCB - called by mqtt library when a message has arrived.
 */
const processCB = (topic, payloadRaw) => {
  const f = 'requests.processCB'
  let config;
  let topic2;
//console.log(f,'enter');
  try {
    payloadStr = payloadRaw.toString();
    if (topic.indexOf('edge/config/request') > -1) {
      console.log(f,'   config: ', topic, payloadStr)
      let payload = JSON.parse(payloadStr)
      console.log(f,'   payload: ', topic, payload)
      switch (payload.type) {
        case 'config':
        case 'deviceConfig':
          config = getDeviceConfig(payload.ip);
          topic2 = `edge/config/send/${payload.ip}`
          break;
        case 'hmiConfig':
          config = getHmiConfig(payload.ip);
          topic2 = `edge/config/send/${payload.ip}`
          break;
      }

      let payloadStr2 = JSON.stringify(config);
      console.log(f,'   send: ', payloadStr2.length, topic2, payloadStr2)
      mqtt_lt.send(topic2, payloadStr2);
    } else if (topic.indexOf('edge/input' > -1)) {
      console.log(f,'   input: ', topic, payloadStr)
    } else {
      msg.pubErrorMsg(f,'Topic not found:',topic)
    }
  } catch (err) {
    msg.pubErrorMsg(f,'catch -',err)
  }
  return null;
}

module.exports.processCB = processCB;
