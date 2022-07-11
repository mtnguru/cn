// import React, {useState} from 'react';

import MqttItem from './MqttItem'
import './MqttList.scss';

function MqttList(props) {
  // if list does not exist - set list to an empty array
  let list = (props.list) ? props.list : []

  return (
    <div className="mqtt-display">
      <div className="nitems">{list.length}</div>
       <div className="mqtt-list">
          {list.map(item => <MqttItem key={item.key} item={item} pretty={props.pretty}/>) }
       </div>
    </div>
  );
}


export default MqttList