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
    <div className="control-panel mqtt-client-bg">
      <h2>Control Panel</h2>
      <div className="control-bar arduino2">
        <label className="label">Arduino2</label>
        <ControlButton client="arduino2" metric="O_arduino2_Reset" type="push" label="Reset" cname="reset" clickH={clickH}></ControlButton>
        <ControlButton client="arduino2" metric="O_arduino2_LED_Onboard_On" type="toggle" label="Onboard Light" className="onboard" clickH={clickH}></ControlButton>
      </div>
      <div className="control-bar arduino3">
        <label className="label">Arduino3</label>
        <ControlButton client="arduino3" metric="O_arduino3_Reset" type="push" label="Reset" cname="reset" clickH={clickH}></ControlButton>
        <ControlButton client="arduino3" metric="O_arduino3_LED_Onboard_On" type="toggle" label="Onboard Light" className="onboard" clickH={clickH}></ControlButton>
      </div>
      <div className="control-bar epiclc">
        <label className="label">EpicLC</label>
        <ControlButton client="epiclc" type="push" label="Reset" cname="reset" clickH={clickH}></ControlButton>

        <ControlButton client="epiclc" type="toggle" label="Blue" cname="onboard blue" clickH={clickH}></ControlButton>
        <ControlButton client="epiclc" type="toggle" label="Green" cname="onboard green" clickH={clickH}></ControlButton>
        <ControlButton client="epiclc" type="toggle" label="Red" cname="onboard red" clickH={clickH}></ControlButton>
      </div>

      <ControlStats metric="I_arduino3_K_LivingRoom_C" type="status" label="Living Room" cname=""></ControlStats>
      <ControlStats metric="I_arduino2_K_Outdoors_C" type="status" label="Outdoors" cname=""></ControlStats>
    </div>
  )
}

export default ControlPanel