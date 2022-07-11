// File: readInputs.js//
//    - Read input channels on groov EPIC and RIO -
//    - Receive MQTT requests and change output channel setpoints
//
// Send data to MQTT server in // Influx line protocol
//    weather,location=us-midwest temperature=82 1465839830100400200
//       |    -------------------- --------------  |
//       |             |             |             |
//    +-----------+--------+-+---------+-+---------+
//    |measurement|,tag_set| |field_set| |timestamp|
//    +-----------+--------+-+---------+-+---------+
const groov_api = require('./groov_api');
const mqttNode = require('./utils/mqttNode');

let readInterval;

const stopInputs = () => {
  console.log (f,'start')
  clearInterval(readInterval)
  console.log (f,'stop')
}

const readInput = async (name,input,ctime) => {
  const f = "readInput:readInput - "
  console.log(f, 'enter ', name)

  const channelReadCB = (data) => {
    const f = 'readInputs::channelReadCB'
    console.log(f,'enter')
    const topic = global.aaa.publishTopics['input'];
    let payload = `${input.tags} value=${data.value.toFixed(2)}`
    mqttNode.publish(topic, payload)
  }

  await groov_api.readChannel(name, input, channelReadCB)
}

/*
  if (input.lastValue) {
    if (input.lastValue == value)  {
      input.nochange++;
      console.log(' ## ', name, '--------------- ', input.nochange, ' no change', value)
    } else {
      input.nochange = 0;
      console.log(' ## ', name, '-- change ', value)
      // Format the influxdb line protocol
      let line = `${input.tags} value=${value} ${ctime}`;
      console.log('      ', input.topic, line);
      mqttNode.publish(input.topic, line)
    }
  } else {
    input.nochange = 0;
  }
  input.lastValue = value;
  console.log (f,'exit')
 */

const readInputs = async () => {
  const f = "readInputs:readInputs - "
  readInterval = setInterval(async () => {
    console.log (f, 'enter')
    const start = performance.now();
    const ntime = new Date().getTime() * 1000000;

    const funcs = [];
    for (let name in global.aaa.metrics) {
      let input = global.aaa.metrics[name].input;
      if (input) {
        funcs.push(readInput(name,input,ntime));
      }
    }

    await Promise.all(funcs)

    const end = performance.now();
    console.log (f, 'end ', end - start)

  }, global.aaa.sampleInterval)
}

module.exports = { readInputs }
