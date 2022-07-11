const gl = require('get-current-line').default
const mqttNode = require('./utils/mqttNode');
const msg     = require('./utils/msg');
const influx  = require('./utils/influx');
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

/*
 * Processes a request for a devices configuration - device, inputs, outputs.
 */
const getClientConfig = (id) => {
  const f = 'configurator:getClientConfig'
  msg(f,DEBUG,'enter',id);

  // Find the client first by clientname, then by searching the IP's of all devices.
  let clientName = '';
  let client;
  if (id in global.aaa.clients) {
    clientName = id
  } else {
    for (client in global.aaa.clients) {
      msg(f, DEBUG, '   check ',global.aaa.clients[client].ip)
      if (id === global.aaa.clients[client].ip) {
        msg(f, DEBUG, 'found client - ', id, client)
        clientName = client;
      }
    }
    if (!clientName) {
      msg(f, ERROR, 'Cannot find client', id)
      return null;
    }
  }

  // Read in the configuration file for the primary device
  const path = `${process.env.ROOT_PATH}/config/clients/${clientName}.json`
  msg(f,NOTIFY,'read: ',path);
  let json = fs.readFileSync(path)
  config = JSON.parse(json)
  config.clientName = clientName;
  config.configType = 'client'
  config.selected = 'true'
  config.project = global.aaa.project
  mqttNode.completeTopics(config)

  // The 3 loops below can be deleted soon
  // Configure the input channels
  for (let name in config.inputs) {
    let channel = config.inputs[name]
    channel.tags = influx.makeTagsFromMetricId(name)    // Create influx tags
    channel.clientName = clientName;        // Add client name
    channel.metric = name                   // add metric name
  }
  // Add properties to output channels
  for (let name in config.outputs) {
    let channel = config.outputs[name]
    channel.tags = influx.makeTagsFromMetricId(name)    // Create influx tags
    channel.clientName = clientName;        // Add client name
    channel.metric = name                   // add metric name
  }
                                            // Add properties to user channels
  for (let name in config.user) {
    let channel = config.user[name]
    channel.tags = influx.makeTagsFromMetricId(name)    // Create influx tags
    channel.clientName = clientName;        // Add client name
    channel.metric = name                   // add metric name
  }
  msg(f,DEBUG, 'exit');
  return config;
}

/**
 * If the primary devices has a clients property, then load those clients also.
 * }
 *
 * @param clients
 * @returns {{}}
 */
const getAllClientsConfig = (clients) => {
  const f = 'configurator::getAllClients'
  msg(f,DEBUG, 'enter');
  const config={}
  for (clientName in clients) {
    if (clientName === "all") {
      config[clientName] = clients[clientName];
    } else {
      config[clientName] = getClientConfig(clientName);
    }
  }
  return config;
}

const loadClientConfig = (clientName) => {
  const f = "configurator::loadClientConfig"
  let payloadOut = getClientConfig(clientName)
  clientName = payloadOut.clientName

// if there is a list of clients in this config - read those in too
  if (payloadOut.clients) {
    msg(f, DEBUG, "load all clients")
    payloadOut.clients = getAllClientsConfig(payloadOut.clients);
  }

// Add the msgTypes to the client
  if (payloadOut.msgTypes) {
    msg(f, DEBUG, "load msgTypes")
    const path = `${process.env.ROOT_PATH}/config/general/msgTypes.json`
    payloadOut.msgTypes = JSON.parse(fs.readFileSync(path))
  }
// Add the metrics to the client

// Build client list
  if (payloadOut.metrics) {
    msg(f, DEBUG, "load metrics, config/metrics/metrics.json")
    const clients = (payloadOut.clients) ? Object.keys(payloadOut.clients) : [clientName]
    const path = `${process.env.ROOT_PATH}/config/metrics/metrics.json`
    payloadOut.metrics = JSON.parse(fs.readFileSync(path))
    for (let metricName in payloadOut.metrics) {
      const metric = payloadOut.metrics[metricName]
      metric.metricName = metricName
      metric.units = metricName.split('_')[-1]

      // Only include metrics that involve clients in the clients list
      if ((metric.input && clients.includes(metric.input.clientName)) ||
          (metric.output && clients.includes(metric.output.clientName)) ||
          (metric.user && clients.includes(metric.user.clientName))) {
        if (metric.input) {
          metric.input.tags = influx.makeTagsFromMetric(metricName,"I")
        }
        if (metric.output) {
          metric.output.tags = influx.makeTagsFromMetric(metricName,"O")
        }
        if (metric.user) {
          metric.user.tags = influx.makeTagsFromMetric(metricName,"U")
        }

        // Move the metric to a metric name with all small letters
        let sMetricName = metricName.toLowerCase()
        if (sMetricName != metricName) {
          payloadOut.metrics[sMetricName] = metric
          delete payloadOut.metrics[metricName]
        }
      } else {
        delete payloadOut.metrics[metricName]
      }
    }
  }
  return payloadOut;
}

/**
 * processCB
 * @param inTopic
 * @param payloadRaw
 * @returns {null}
 */
const processCB = (inTopic, payloadRaw) => {
  const f = 'configurator::processCB'
  msg(f,DEBUG, 'enter');
  let payloadOut;
  let outTopic;
  try {
    const [project, msgType, action, clientName, telegraf] = inTopic.split('/')

    const payloadInStr = payloadRaw.toString();
    let payloadIn = {}

    // If the payload is JSON, parse it
    if (payloadInStr && payloadInStr !== '{}') {
      msg(f, DEBUG,"Parse payloadInStr:", payloadInStr.toString)
      payloadIn = JSON.parse(payloadInStr)
    }
    msg(f,DEBUG, 'msgType', msgType, ' action', action);

    // If this is a config message
    if (msgType === 'admin') {
      if (action === 'config' || action === 'file') {
        msg(f, DEBUG, "Ignore all 'config' messages: ", action, ' - ', inTopic)
        return;
      }

      if (action === 'configReq') {
        outTopic = mqttNode.makeTopic(ADMIN, 'config', {clientName: clientName})
        payloadOut = loadClientConfig(clientName)
      } else if (action === 'fileReq') {
        outTopic = mqttNode.makeTopic(ADMIN,'file', {clientName: clientName})

        path = `${process.env.ROOT_PATH}/config/${payloadIn.path}`
        msg(f, DEBUG, "Read json file: ", path)
        json = fs.readFileSync(path)
        payloadOut = JSON.parse(json)
      } else if (action === "reset") {
        msg(f, DEBUG, "Ignore reset requests")

      } else {
        msg(f, ERROR,"Unknown configuration request: ", action, ' - ', inTopic)
        return;
      }
    // else Not a config message
    } else {
      msg(f, DEBUG,"call readJsonFile")
      if (!payloadIn.filename) {
        msg(f, ERROR,"Payload must specify a filename: ", action)
      }
      payloadOut = readJsonFile(`${flds[3]}/${payloadIn.filename}`)
      if (!payloadOut) {
        msg(f, ERROR,"Cannot read configuration file", action)
        return;
      }
    }

    let payloadOutStr = JSON.stringify(payloadOut);
    msg(f, DEBUG,"call mqttNode.publish ",outTopic, payloadOut)
    mqttNode.publish(outTopic, payloadOutStr);
  } catch (err) {
    msg(f, ERROR, err)
  }
//msg(f,DEBUG, 'exit');
  return null;
}

module.exports.processCB = processCB;