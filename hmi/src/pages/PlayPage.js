import ControlPanel from '../panels/ControlPanel/ControlPanel.js';
import ControlSliderPanel from "../panels/ControlPanel/ControlSliderPanel";
import DoePanel from "../panels/DoePanel/DoePanel";
import ControlExptPanel from "../panels/ControlPanel/ControlExptPanel";
import MqttPanel from "../panels/MqttPanel/MqttPanel";

function PlayPage() {
  return (
    <div className="mqtt-page">
      <ControlExptPanel title='Experiment Panel'/>
      <ControlPanel title='Control Panel'/>
      <ControlSliderPanel title='Control Slider Panel'/>
      <DoePanel title='DOE Panel' />
    </div>
  )
}

export default PlayPage;