// File: ControlStats.js
import React, {useState, useEffect} from 'react';
import {mqttRegisterInfluxCB} from '../../utils/mqtt'

import './ControlStats.scss'

const ControlStats = (props) => {
  const [register, setRegister] = useState(true);
  const [stat, setStat] = useState(0);

  useEffect(() => {
    if (register) {
      mqttRegisterInfluxCB(props.metric, metricCB)
      setRegister(prevRegister => {
        return false
      })
    }
  }, [register, props.metric])

  const metricCB = (topic, payload, tags, values) => {
    const f = "ControlStats::metricCB"
    setStat(values.value)
    console.log(f,"enter ", topic)
  }

  return (
    <div className="control-stats">
      <h3>{props.metric}</h3>
      <div className="stat">{stat}</div>
    </div>
  )
}

export default ControlStats