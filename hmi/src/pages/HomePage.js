
import ControlExptPanel from '../panels/ControlPanel/ControlExptPanel.js';
import MqttPanel from '../panels/MqttPanel/MqttPanel.js';
import ControlPanel from '../panels/ControlPanel/ControlPanel.js';
import ControlSliderPanel from '../panels/ControlPanel/ControlSliderPanel.js';
import DoePanel from '../panels/DoePanel/DoePanel.js';
// import GrafanaPanel from '../panels/GrafanaPanel/GrafanaPanel.js';

function MqttPage() {
  return (
    <div className="mqtt-page">
      <ControlExptPanel title='Experiment Panel'/>
      <ControlPanel title='Control Panel'/>
    </div>
  )
}

export default MqttPage;