import HmiInputs from './HmiInputs';
import HmiOutputs from './HmiOutputs';

function HmiPanel() {
  return (
    <div className="hmi-panel">
      <h2>HMI Panel</h2>
      <HmiInputs></HmiInputs>
      <HmiOutputs></HmiOutputs>
    </div>
  );
}

export default HmiPanel