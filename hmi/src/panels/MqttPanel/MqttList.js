// import React, {useState} from 'react';

import MqttItem from './MqttItem'
import './MqttList.scss';

function MqttList(props) {
  // Initialize State for the list

  return (
    <div className="mqtt-display">
       <div className="mqtt-list">
          { props.list.map(item => <MqttItem key={item.key} item={item} pretty={props.pretty}/>) }
       </div>
    </div>
  );
}

export default MqttList