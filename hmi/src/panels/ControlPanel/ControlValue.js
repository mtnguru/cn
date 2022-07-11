// File: ControlValue.js
import React, {useState, useEffect} from 'react';
//import useMousePosition from '../../hooks/useMousePosition';
import {mqttRegisterMetricCB} from '../../utils/mqttReact'
import {c2f, findMetric} from '../../utils/metrics'

import './ControlValue.scss'

const ControlValue = (props) => {
//const [register, setRegister] = useState(true);
  const [stat, setStat] = useState(0);
  const [metric, setMetric] = useState({});

  useEffect(() => {
    const metricCB = (metric, topic, payload, tags, values) => {
      const f = "ControlValue::metricCB"
      console.log(f,"enter ", topic)
      setStat((prevStat) => {
        let val = values.value;
        if (props.hmetric.convert === 'c2f') {
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

//const [ref, mousePosition] = useMousePosition();

//useEffect(() => {
//  // do something with the mouse position values here
//  console.log(mousePosition);
//}, [mousePosition]);

  let initialX;
  let initialY;
  let currentX;
  let currentY;
  let xOffset = 0;
  let yOffset = 0;
  let active;
  let dragItem;

  function onDragStart(e) {
    const f = 'ControlValue::onDragStart'
    console.log(f,'drag start')
    if (e.type === "touchstart") {
      initialX = e.touches[0].clientX - xOffset;
      initialY = e.touches[0].clientY - yOffset;
    } else {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
    }

    if (e.target === dragItem) {
      active = true;
    }
  }

  function onDragEnd(e) {
    const f = 'ControlValue::onDragEnd'
    console.log(f,'drag end')
    initialX = currentX;
    initialY = currentY;

    active = false;
  }

  const onDrag = (e) => {
    const f = 'ControlValue::onDrag'
    console.log(f,'dragging')
    if (active) {

      e.preventDefault();

      if (e.type === "touchmove") {
        currentX = e.touches[0].clientX - initialX;
        currentY = e.touches[0].clientY - initialY;
      } else {
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
      }

      xOffset = currentX;
      yOffset = currentY;

      setTranslate(currentX, currentY, dragItem);
    }
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";
  }

  return (
    <div className="control-value"
         title={metric.label}
         onMouseMove={onDrag}
         onMouseDown={onDragStart}
         onMouseUp={onDragEnd}
         style={{top: props.hmetric.position[0] + '%', left:props.hmetric.position[1] + '%'}}
    >
      <div className="stat">{stat}</div>
    </div>
  )
}

export default ControlValue