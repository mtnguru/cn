import React, { useEffect, useState } from 'react'
import "./MqttFilterType.scss";
import CheckboxList from "../../components/ui/CheckboxList";

const lsKey = "cnFilterType"

function MqttFilterType(props) {

  const [allSelected, setAllSelected] = useState(false)

  useEffect(() => {
    const f = "MqttFilterType::useEffect"
    let lsstr = localStorage.getItem(lsKey);
    console.log(f, lsstr)
    let ls;
    if (lsstr) { // if local storage already exists
      ls = JSON.parse(lsstr)
      for (let type in global.aaa.msgTypes) {  // copy selected values into global records
        const selected = (ls[type]) ? ls[type].selected : true;
        global.aaa.msgTypes[type].selected = selected
      }
    } else {
      ls = {};
      for (let type in global.aaa.msgTypes) {
        console.log(f,'initialize localStorage ', type)
        if (!ls[type]) ls[type] = {}
        ls[type].selected = true
        global.aaa.msgTypes[type].selected = true
      }
      localStorage.setItem(lsKey, JSON.stringify(ls))
    }
    setAllSelected(global.aaa.msgTypes.all.selected)
    console.log(f,'exit', ls)
  }, [])

  const onChangeH = event => {
    console.log('MqttFilterType::onChangeH',event.target.checked)
    global.aaa.msgTypes[event.target.id]['selected'] = event.target.checked

    if (event.target.id === 'all') {
      setAllSelected(event.target.checked)
    }
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
      <div className={`select mqtt-type-bg ${allSelected ? "all-selected" : ""}`}>
        <CheckboxList list={global.aaa.msgTypes} onChangeH={onChangeH} />
      </div>
    </div>
  );
}

export default MqttFilterType
