/* File: groov_api.js
 * Functions to connect with Groov REST api
 */
require('dotenv').config();

// Temporary - bypass issues with certificates
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

const msg     = require('./utils/msg');
const https = require ("https");
const axios = require ("axios");
const sprintf = require('sprintf-js').sprintf;
const util = require('util')
const mqttNode = require('./utils/mqttNode')

//var axiosGet = util.promisify(axios.get);

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
  const f = "groov_api.js::writeChannel"
  msg(f,DEBUG,'enter')
  let ip = global.aaa.ip
  let url = sprintf('https://%s/%s/modules/%s/channels/%s/%s/state',
    global.aaa.ip,
    route,
    output['module'],
    output['channel'],
    output['type'])
  console.log('Url: ', url)
  msg(f,DEBUG,'url: ',url)

  try {
    const res = await axios.put(url, body, { headers: output.headers});
  } catch (err) {
    console.log(`Error axiosPut: ${err}`)
    console.log( err.response.request )
  }
}

//function readChannel(url, module, channel, type) {
const readChannel = async (name, sensor, cb) => {
  const f = "groov_api.js::readChannel"
  let client = global.aaa
  // Create the API URL
  let url = sprintf('https://%s/%s/modules/%s/channels/%s/%s/status',
    client.name,
    route,
    sensor['module'],
    sensor['channel'],
    sensor['type'])

  let payload;
  let res;
  try {
    let metric = global.aaa.metrics[name];
    if (metric) {
      res = await axios.get(url,{headers: client.headers});
      console.log(f,' channel read ', res.data.value)
      cb(res.data)
    } else {
      console.log(f, 'readChannel - ERROR: metric not found.')
    }
  } catch (err) {
    console.log(`Error: ${err}`)
  }
}

module.exports = { writeChannel, readChannel }
