import React from 'react'
import "./MqttDisplayActions.scss";
import Button from "../../components/ui/Button";

function MqttDisplayActions(props) {

  return (
    <div className="mqtt-display-actions">
      <div className="buttons">
        <Button type="push" className="pretty" name={props.pretty} onclick={props.actions.onPretty}></Button>
        <Button type="push" className="clear" name="Clear list" onclick={props.actions.onClearList}></Button>
      </div>
    </div>
  );
}

export default MqttDisplayActions