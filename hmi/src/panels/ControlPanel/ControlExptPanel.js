import React, {useState, useEffect} from 'react'
// File: ControlText.js
// import React, {useState} from 'react';

// import ControlText from './ControlText'
// import ControlButton from './ControlButton'
// import ControlSlider from './ControlSlider'
// import ControlBar from './ControlBar'
// import {findMetric} from '../../utils/metrics'

import ControlValue from './ControlValue'

import './ControlExptPanel.scss'
import {mqttReqFile} from "../../utils/mqttReact";

const panelName = 'expt'

const ControlExptPanel = (props) => {
  const [hmi, setHmi] = useState({ metrics: {}})

  const onLoadCB = (topic, payload) => {
    let hmi = global.aaa.hmi = payload;
    setHmi(hmi)
  }

  useEffect(() => {
    mqttReqFile(panelName, `hmi/panel/${panelName}.json`, onLoadCB)
  }, [])

//const clickH = (event) => {
//  console.log('clickH', event.target);
//}

  return (
    <div className="panel control-expt-panel mqtt-client-bg">
        <h2>Experiment panel</h2>
        <div className="control-flex">
          <div className="stats">
            {Object.keys(hmi.metrics).map((metricName) => {
              return <ControlValue key={metricName} hmetric={hmi.metrics[metricName]} metricName={metricName}></ControlValue>
            })}
          </div>
        </div>
    </div>
  )
}

export default ControlExptPanel
