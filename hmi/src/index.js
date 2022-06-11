import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

import { mqttConnect, mqttPublish, mqttProcessCB, mqttRegisterClientCB } from './utils/mqtt.js';

const f = "index::main"

const loadClientConfigCB = (topic, payload) => {
  const f = "index::loadClientConfigCB"
  let config = JSON.parse(payload.toString(0));
  console.log(f,'enter', topic)

  // Create full list of inputs and outputs by combining them from all clients
  config.inputs = {}
  config.outputs = {}
  for (let clientName in config.clients) {
    if (clientName !== "server") {
      const client = config.clients[clientName]
      for (let inputName in client.inputs) {
        const input = client.inputs[inputName]
        config.inputs[inputName.toLowerCase()] = input;

      }
      for (let outputName in client.outputs) {
        const output = client.outputs[outputName]
        config.outputs[outputName.toLowerCase()] = output;
      }
    }
  }
  global.cn = config;
  console.log(f,'exit', topic, config)

  startReact()
}

const getConfig = () => {
  const topic = 'lab1/config/client/hmi1'
  const payloadStr = "{}"
  console.log('getConfig::call mqttPublish')
  mqttPublish(topic, payloadStr)
  mqttRegisterClientCB('lab1/config/post/hmi1', loadClientConfigCB)
  console.log('getConfig::exited mqttPublish')
}

mqttConnect(mqttProcessCB);
console.log(f,' - requestConfig ')
getConfig();

setTimeout(() => {
  console.log('darnit')
}, 2000)

// const configCB = () => {
//   const promise = new Promise ((resolve, reject) => {
//
//   })
// }
const startReact = () => {
  console.log('startReact enter')
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <BrowserRouter>
      <App/>
    </BrowserRouter>
  );
}