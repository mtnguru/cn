// File: ControlText.js
// import React, {useState} from 'react';

// import ControlText from './ControlText'
import ControlButton from './ControlButton'
// import ControlSlider from './ControlSlider'

import ControlStats from './ControlStats'
// import ControlBar from './ControlBar'

import './ControlPanel.scss'

const ControlPanel = (props) => {
  const clickH = (event) => {
    console.log('clickH', event.target);
  }

  return (
    <div className="panel control-panel mqtt-client-bg">
      <h2>Control panel</h2>
      <div className="control-flex">
        <div className="controls">
          <div className="control-bar arduino2">
            <label className="label">Arduino2</label>
            <ControlButton client="arduino2" metricName="arduino2_Reset" type="push" label="Reset" cname="reset" clickH={clickH}></ControlButton>
            <ControlButton client="arduino2" metricName="arduino2_LED_Onboard_On" type="toggle" label="Onboard Light" className="onboard" clickH={clickH}></ControlButton>
          </div>
          <div className="control-bar arduino3">
            <label className="label">Arduino3</label>
            <ControlButton client="arduino3" metricName="arduino3_Reset" type="push" label="Reset" cname="reset" clickH={clickH}></ControlButton>
            <ControlButton client="arduino3" metricName="arduino3_LED_Onboard_On" type="toggle" label="Onboard Light" className="onboard" clickH={clickH}></ControlButton>
          </div>
          <div className="control-bar epiclc">
            <label className="label">EpicLC</label>
            <ControlButton client="epiclc" metricName="reset" type="push" label="Reset" cname="reset" clickH={clickH}></ControlButton>

            <ControlButton client="epiclc" metricName="Backpanel_LED_Blue_On" type="toggle" cname="blue" label="Blue" clickH={clickH}></ControlButton>
            <ControlButton client="epiclc" metricName="Backpanel_LED_Green_On" type="toggle" cname="green" label="Green" clickH={clickH}></ControlButton>
            <ControlButton client="epiclc" metricName="Backpanel_LED_Red_On" type="toggle" cname="red" label="Red" clickH={clickH}></ControlButton>
          </div>
        </div>

        <div className="stats">
          <ControlStats metricName="arduino3_K_LivingRoom_C" type="status" label="Living Room" cname=""></ControlStats>
          <ControlStats metricName="arduino2_K_Outdoors_C" type="status" label="Outdoors" cname=""></ControlStats>
          <ControlStats metricName="PID_RTD_C" type="status" label="PID" cname=""></ControlStats>
        </div>
        <div className="stats">
          <ControlStats metricName="Cabin_K_Bedroom_C" type="status" label="Rio Bedroom" cname=""></ControlStats>
          <ControlStats metricName="Cabin_K_Fireplace_C" type="status" label="Rio Fireplace" cname=""></ControlStats>
          <ControlStats metricName="Cabin_K_Outside_C" type="status" label="Rio Outside" cname=""></ControlStats>
        </div>
      </div>
    </div>
  )
}

export default ControlPanel