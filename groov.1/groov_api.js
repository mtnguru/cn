/* File: groov_api.js
 * Functions to connect with Groov REST api
 */

require('dotenv').config();
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

const https = require ("https");
const axios = require ("axios");
const sprintf = require('sprintf-js').sprintf;
const util = require('util')

require('dotenv').config();

const devices = require (`${process.env.ROOT_PATH}/config/devices.js`);
var axiosGet = util.promisify(axios.get);

const route = 'manage/api/v1/io/local'

const instance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});

const agent = new https.Agent({
  rejectUnauthorized: false
})

//function writeChannel(url, module, channel, type, value) {
const writeChannel = async (name, output, body) => {
  console.log('Enter writeChannel - device: ', output.device)
  let device = devices[output.device]
  console.log(`device ${device}`)
  let url = sprintf('https://%s/%s/modules/%s/channels/%s/%s/state',
    device.ip,
    route,
    output['module'],
    output['channel'],
    output['type'])
  console.log('Url: ', url)

  try {
    const res = await axios.put(url, body, { headers: device.headers});
  } catch (err) {
    console.log(`Error axiosPut: ${err}`)
    console.log( err.response.request )
  }
}

//function readChannel(url, module, channel, type) {
const readChannel = async (name, sensor) => {
  let device = devices[sensor.device]

  // Create the API URL
  let url = sprintf('https://%s/%s/modules/%s/channels/%s/%s/status',
    device.ip,
    route,
    sensor['module'],
    sensor['channel'],
    sensor['type'])

  let value = null;
  try {
    const res = await axios.get(url,{headers: device.headers});
    value = JSON.stringify(res.data.value);
  } catch (err) {
    console.log(`Error: ${err}`)
  }

//console.log('Leave readChannel ', value)
  return value;
}

module.exports = { writeChannel, readChannel }

