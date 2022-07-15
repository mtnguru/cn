import ControlSliderPanel from "../panels/ControlPanel/ControlSliderPanel";
import DoePanel from "../panels/DoePanel/DoePanel";

function DoePage() {
  return (
    <div className="mqtt-page">
      <DoePanel title='DOE Panel' />
      <ControlSliderPanel title='Control Slider Panel'/>
    </div>
  )
}
export default DoePage;