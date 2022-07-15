// File: ControlStats.js
import React, {useState, useEffect} from 'react';
import {mqttRegisterMetricCB} from '../../utils/mqttReact'
import {c2f, findMetric} from '../../utils/metrics'

import './ControlStats.scss'

const ControlStats = (props) => {
//const [register, setRegister] = useState(true);
  const [stat, setStat] = useState(0);
  const [metric, setMetric] = useState({});

  useEffect(() => {
    const metricCB = (metric, topic, payload, tags, values) => {
      const f = "ControlStats::metricCB"
      console.log(f,"enter ", topic)
      setStat((prevStat) => {
        let val = values.value
        if (metric.convert === 'c2f') {
          val = c2f(val)
        }
        return parseFloat(val).toFixed(metric.decimals);
      })
      if (props.metricCB) {
        props.metricCB(metric, topic, payload, tags, values)
      }
    }

    setMetric(findMetric(props.metricName))
    mqttRegisterMetricCB(props.metricName, metricCB)
  }, [props.metricName])

//if (register) {
//  mqttRegisterMetricCB(props.metric, metricCB)
//  register = false
//}

  return (
    <div className="control-stats">
      <h3>{metric.label}</h3>
      <div className="metric">{metric.metricName}</div>
      <div className="stat">{stat}</div>
    </div>
  )
}

export default ControlStats