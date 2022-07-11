// File: ControlText.js
// import React, {useState} from 'react';

import ControlSlider from './ControlSlider'
import Card from '../../components/ui/Card'

import './ControlSliderPanel.scss'

const ControlSliderPanel = (props) => {
  const onChange = (event) => {
  }

  return (
    <div className="panel control-slider">
      <h2>Simulation panel</h2>
      <div className="control-flex">
        <Card>
          <h3>Static</h3>
          <ControlSlider client="arduino2" metricName="Ch_MFC_Gas_D2_sccm" onChange={onChange} />
          <ControlSlider client="arduino2" metricName="Ch_K_TopCenter_C" onChange={onChange} />
        </Card>
        <Card>
          <h3>Variable</h3>
          <ControlSlider client="arduino2" metricName="Ch_Baratron_torr" onChange={onChange} />
          <ControlSlider client="arduino2" metricName="PS_DC_V" onChange={onChange} />
          <ControlSlider client="arduino2" metricName="Ch_MFC_Gas_N2_sccm" onChange={onChange} />
        </Card>
      </div>
    </div>
  )
}

export default ControlSliderPanel