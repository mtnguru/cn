const groov_api = require('./groov_api')
const requests = require('./requests.js')
require('dotenv').config();

const setConfig = (config) => {
  const f = "requests:setConfig - "
  console.log(f,'enter', config);
  stopInputs()
  global.config = config;
  readInputs()
  console.log(f,'exit');
}

processOutput

const process = (topic, payload_json) => {
  const f = "requests:process - "
  console.log(f,'enter', topic, payload_json.toString())
  try {
    let payload = JSON.parse(payload_json.toString())
    if (topic.indexOf(topic,'config')) {
      setConfig(payload)
    } else if (topic.indexOf(topic,'output')) {
      let name = payload.deviceName
      console.log(f,'name', name)

      let value = null
      if (payload.value == 'On') {
        value = true;
      } else if (payload.value == 'Off') {
        value = false;
      }
      groov_api.writeChannel(name, output, `\{"value": ${value}\}`)
    }
  } catch (err) {
    console.log(f,'ERROR processRequest ' + err)
  }
  console.log(f,'exit')
}

module.exports = {process};