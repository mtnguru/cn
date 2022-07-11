// File: ControlSlider.js
import React, {useState, useEffect} from 'react';

import './ControlSlider.scss'
import {mqttPublish, mqttRegisterMetricCB} from '../../utils/mqttReact'
import {findMetric} from '../../utils/metrics'
import {mgError} from "../../utils/mg";

const ControlSlider = (props) => {

  const metric = findMetric(props.metricName)
//const [metric, setMetric] = useState({});
  const [value, setValue] = useState(metric.user.default)
  const [outValue, setOutValue] = useState(0)

  useEffect(() => {
    mqttRegisterMetricCB(props.metricName, metricCB)
//  setMetric(findMetric(props.metricName))
  }, [props.metricName])

  const metricCB = (metric, topic, payload, tags, values) => {
    const f = "ControlStats::metricCB"
    const msgType = topic.split('/')[1]
    if (msgType === 'user') {
//    setValue(values.value)
    } else if (msgType === 'output') {
      setOutValue(parseFloat(values.value).toFixed(metric.decimals))
    }
    console.log(f,"enter ", topic)
  }

  const onChange = (event) => {
    setValue(parseFloat(event.target.value).toFixed(metric.decimals))
    const f = "ControlSliderPanel::onChange"
    console.log('onChange', event.target.value, event.target.id);
//  const metric = global.aaa.metrics[event.target.id.toLowerCase()]
    if (!metric) {
      mgError(f,"Metric not found: ",event.target.id)
    }
    const topic = global.aaa.publishTopics['user'];
    let value = event.target.value;
    let payload = `${metric.user.tags} value=${parseFloat(value).toFixed(2)}`
    mqttPublish(topic, payload)
  }

  return (
    <div className="control-slider">
      <label htmlFor={props.metricName}>{metric.label}</label>
      <div className="container">
        <input
          id={metric.metricName}
          type="range"
          min={metric.user.min}
          max={metric.user.max}
          step={metric.user.step}
          className="slider"
          onInput={onChange}
          value={value}
          list="slider-list" />
        <datalist id="slider-list">
          <option>{metric.user.min}</option>
          <option>{metric.user.min + (metric.user.max - metric.user.min) / 2}</option>
          <option>{metric.user.max}</option>
        </datalist>
        <div className="labels">
          <span className="middle">{metric.user.min + (metric.user.max - metric.user.min) / 2}</span>
          <span className="right">{metric.user.max}</span>
          <span className="left">{metric.user.min}</span>
        </div>
      </div>
      <div className="value">{value}</div>
      <div className="outValue">{outValue}</div>
    </div>
  )
}

export default ControlSlider
