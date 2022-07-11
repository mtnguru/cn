import React from 'react'
import "./MqttDisplayActions.scss";
import Button from "../../components/ui/Button";

function MqttDisplayActions(props) {

  return (
    <div className="mqtt-display-actions">
      <div className="buttons">
        <Button type="push" className="pretty" label={props.pretty} onClick={props.actions.onPretty}></Button>
        <Button type="push" className="clear" label="Clear" onClick={props.actions.onClearList}></Button>
      </div>
    </div>
  );
}

export default MqttDisplayActions