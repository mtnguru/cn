// File: ControlButton.js

import React, {useState} from 'react';


import "./ControlButton.scss";
import {mqttPublish} from "../../utils/mqtt";

const ControlButton = (props) => {
  const [btnState, setBtnState] = useState(false)
  const clickH = (event) => {
    console.log('Button pressed',event.target.id)
    let topic;
    let payload;
    if (props.type === "push") {
      topic = 'lab1/admin/reset/' + props.client
      payload = ''
    } else if (props.type === "toggle") {
      setBtnState((prevState) => {
        return !prevState
      })
      topic = 'lab1/output/control/' + props.client
      payload = `{"metric": "${props.metric}", "value": "${btnState ? "1" : "0"}"}`
    }
    console.log('   send ', topic, payload)
//  props.onclick(event)
    mqttPublish(topic, payload)
  }

  return (
    <div className={`control-button ${props.cname}`}>
      <button onClick={clickH} className={btnState ? "on" : "off"}>{props.label}</button>
    </div>
  )
}

export default ControlButton