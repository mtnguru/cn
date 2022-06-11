const gl = require('get-current-line').default
const mqttCn = require('./utils/mqttCn');
const msg     = require('./utils/msg');
const fs = require('fs');

require('dotenv').config();

/*
 * Processes a request for a devices configuration - device, inputs, outputs.
 */
const getHmiConfig = (ip) => {
  const f = 'configurator::getHmiConfig'
  msg(f,DEBUG, 'enter ',ip);
  return global.config.hmi;
}

const getJsonFile = (filepath) => {

}

/**
 * createTags() - Given the metric name, create the influxdb line protocol tags string
 *
 * 1 Input/User/output
 * 2 Component
 * 3 Device
 * 4 Position
 * 5 Composition
 * 6 Units
 **/
const createTags = (metric) => {
  const f = "configurator::createTags"
  const flds = metric.split("_")
  const nflds = flds.length;
  let tags = '';
  if (nflds <= 2) {
    tags = metric
  } else {
    tags = `${flds[nflds - 1]},Metric=${metric},Type=${flds[0]},Component=${flds[1]}`
    if (nflds > 3) {
      tags += `,Device=${flds[2]}`
      if (nflds > 4) {
        tags += `,Position=${flds[3]}`
        if (nflds > 5) {
          tags += `,Composition=${flds[4]}`
        }
      }
    }
  }
  return tags;
}

/*
 * Processes a request for a devices configuration - device, inputs, outputs.
 */
const getClientConfig = (ip) => {
  const f = 'configurator:getClientConfig'
  msg(f,NOTIFY,'enter',ip);

  // Find the client first by clientname, then by searching the IP's of all devices.
  let clientName = '';
  let client;
  if (ip in global.cn.clients) {
    clientName = ip
  } else {
    for (client in global.cn.clients) {
      if (ip === global.cn.clients[client]) {
        msg(f, DEBUG, '  found ', ip, client)
        clientName = client;
      }
    }
    if (!clientName) {
      msg(f, ERROR, 'Cannot find client', clientName)
      return null;
    }
  }

  // Read in the configuration file for the primary device
  let data = fs.readFileSync(`${process.env.ROOT_PATH}/config/clients/${clientName}.json`)
  config = JSON.parse(data)
  config.ip = ip
  config.clientName = clientName;
  config.configType = 'client'
  config.selected = 'true'
  mqttCn.completeTopics(config)

                                            // Add properties to input channels
  for (let name in config.inputs) {
    let channel = config.inputs[name]
    channel.tags = createTags(name)         // Create influx tags
    channel.clientName = clientName;        // Add client name
    channel.metric = name                   // add metric name
    channel.lastValue = ''                  // add last value
    channel.sum = 0;                        // sum  - sum/npts = average
    channel.npts = 0;                       // Npts used to calc average
    channel.lastValueTime = 0;              // add last value time
    channel.cbs = {};                       // Callbacks for handling new input
  }

                                            // Add properties to output channels
  for (let name in config.outputs) {
    let channel = config.outputs[name]
    channel.tags = createTags(name)         // Create influx tags
    channel.clientName = clientName;        // Add client name
    channel.metric = name                   // add metric name
    channel.cbs = {};                       // Callbacks for handling new input
  }

                                            // Add properties to user channels
  for (let name in config.user) {
    let channel = config.user[name]
    channel.tags = createTags(name)         // Create influx tags
    channel.clientName = clientName;                // Add client name
    channel.metric = name                           // add metric name
    channel.cbs = {};   // Callbacks for handling new input
  }
  msg(f,DEBUG, 'exit');
  return config;
}

/**
 * If the primary devices has a clients property, then load those clients also.
 *
 * @param clients
 * @returns {{}}
 */
const getAllClientsConfig = (clients) => {
  const f = 'configurator::getAllClients'
  msg(f,DEBUG, 'enter');
  const config={}
  for (clientName in clients) {
    msg(f,DEBUG, 'DUDE - ',clientName);
    if (clientName === "all") {
      config[clientName] = clients[clientName];
    } else {
      config[clientName] = getClientConfig(clientName);
    }
  }
  return config;
}

/**
 * processCB -
 * @param inTopic
 * @param payloadRaw
 * @returns {null}
 */
const processCB = (inTopic, payloadRaw) => {
  const f = 'configurator::processCB'
//msg(f,DEBUG, 'enter');
  let payloadOut;
  let outTopic;
  try {
    const [project, msgType, action, clientName, telegraf] = inTopic.split('/')

    const payloadInStr = payloadRaw.toString();
    let payloadIn = {}
    if (payloadInStr && payloadInStr !== '{}') {
      msg(f, DEBUG,"Parse payloadInStr:", payloadInStr.toString)
      payloadIn = JSON.parse(payloadInStr)
    }
    msg(f,DEBUG, 'msgType', msgType, ' action', action);
    // If this is a config message
    if (msgType === 'config') {
      if (action === 'post') {
        msg(f, DEBUG, "Ignore all 'post' messages: ", action, ' - ', inTopic)
        return;
      }

      if (action === 'client') {
        payloadOut = getClientConfig(clientName);
        outTopic = mqttCn.makeTopic(CONFIG,'post', {clientName: clientName})

        // if there is a list of clients in this config - read those in too
        if (payloadOut.clients) {
          console.log(f,"load all clients")
          payloadOut.clients = getAllClientsConfig(payloadOut.clients);
        }
//    } else if (action === 'allclients') {
//      payloadOut = getAllClientsConfig(clientName);
//      msg(f, DEBUG,"get all clients config")
//      outTopic = mqttCn.makeTopic(CONFIG,'post', {clientName: clientName})
      } else {
        msg(f, ERROR,"Unknown configuration request: ", action, ' - ', inTopic)
        return;
      }
    // else Not a config message
    } else {
      msg(f, DEBUG,"call readJsonFile")
      if (!payloadIn.filename) {
        msg(f, ERROR,"Payload must specify a filename", action)
      }
      payloadOut = readJsonFile(`${flds[3]}/${payloadIn.filename}`)
      if (!payloadOut) {
        msg(f, ERROR,"Cannot read configuration file", action)
        return;
      }
    }

    let payloadOutStr = JSON.stringify(payloadOut);
    msg(f, DEBUG,"call mqttCn.send ",outTopic, payloadOut)
    mqttCn.send(outTopic, payloadOutStr);
  } catch (err) {
    msg(f, ERROR, err)
  }
//msg(f,DEBUG, 'exit');
  return null;
}

module.exports.processCB = processCB;
module.exports.createTags = createTags;