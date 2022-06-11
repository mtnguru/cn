import React, { useEffect } from 'react'
import "./MqttFilterType.scss";
import CheckboxList from "../../components/ui/CheckboxList";

const lsKey = "cnFilterType"

function MqttFilterType(props) {
//const [msgTypes, setMsgTypes] = useState(global.cn.msgTypes)

  useEffect(() => {
    const f = "MqttFilterType::useEffect"
    let lsstr = localStorage.getItem(lsKey);
    console.log(f, lsstr)
    let ls;
    if (lsstr) { // if local storage already exists
      ls = JSON.parse(lsstr)
      for (let type in global.cn.msgTypes) {  // copy selected values into global records
        const selected = (ls[type]) ? ls[type].selected : true;
        if (global.cn.msgTypes) {
          global.cn.msgTypes[type].selected = selected
        } else {
          global.cn.msgTypes = {
            name: type,
            selected: selected,
          }
        }
      }
    } else {
      ls = {};
      for (let type in global.cn.msgTypes) {
        console.log(f,'initialize localStorage ', type)
        if (!ls[type]) ls[type] = {}
        ls[type].selected = true
        global.cn.msgTypes[type].selected = true
      }
      localStorage.setItem(lsKey, JSON.stringify(ls))
    }
    console.log(f,'exit', ls)
  }, [])

  const onChangeH = event => {
    console.log('MqttFilterType::onChangeH',event.target.checked)
    global.cn.msgTypes[event.target.id]['selected'] = event.target.checked

    let ls = JSON.parse(localStorage.getItem(lsKey))
    if (!ls[event.target.id]) {
      ls[event.target.id] = {}
    }
    ls[event.target.id]['selected'] = event.target.checked
    localStorage.setItem(lsKey, JSON.stringify(ls))

    props.onChangeH(event);
  }

  return (
    <div className="mqtt-filter-type">
      <h3>Msg Type</h3>
      <div className="select mqtt-type-bg">
        <CheckboxList list={global.cn.msgTypes} onChangeH={onChangeH} />
      </div>
    </div>
  );
}

export default MqttFilterType