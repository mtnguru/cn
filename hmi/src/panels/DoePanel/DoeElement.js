import React, {useState, useEffect} from 'react'
import {findMetric, getValue} from '../../utils/metrics'
import {mqttRegisterMetricCB} from '../../utils/mqttReact'
import './DoeElement.scss'

const DoeElement = (props) => {
  const [metric, setMetric] = useState(null)
  const [redraw, setRedraw] = useState(false)

  useEffect(() => {
    mqttRegisterMetricCB(props.metricName,metricCB)
    setMetric(findMetric(props.metricName))
  }, [props.metricName])

  const metricCB = (metric, topic, payload, tags, values) => {
    const f = "DoeElement::metricCB"
    console.log(f, "enter ", topic)
    setRedraw(prevRedraw => {
      return Math.random()
    })
  }

  let difference = 0;
  let colorClass = "difference-grey-bg"
  if (metric != null) {
    let value = getValue(metric)
    difference = value - props.element.value
    if (difference  < -5) {
      colorClass = "difference-red-bg"
    } else if (difference < -1) {
      colorClass = "difference-orange-bg"
    } else if (difference >= -1 && difference <= 1) {
      colorClass = "difference-green-bg"
    } else if (difference > 5) {
      colorClass = "difference-blue-bg"
    } else if (difference > 1) {
      colorClass = "difference-cyan-bg"
    }
  }

  return (
    <td key={props.metricName} className={`doe-element`} redraw={redraw.toString()}>
      <span className={"setpoint"}>{props.element.value}</span>
      <span className={"direction"}> </span>
      <span className={`difference ${colorClass}`}>{difference}</span>
    </td>
  )
}

export default DoeElement