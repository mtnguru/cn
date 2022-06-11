import React, {useEffect} from 'react'
import "./MqttFilterClient.scss";
import CheckboxList from "../../components/ui/CheckboxList";

const lsKey = "cnFilterClient"

function MqttFilterClient(props) {

  useEffect(() => {
    const f = "MqttFilterClient::useEffect"
    let lsstr = localStorage.getItem(lsKey);
    console.log(f, lsstr)
    let ls;
    if (lsstr) {
      ls = JSON.parse(lsstr)
      for (let clientName in global.cn.clients) {
        global.cn.clients[clientName].selected = ls[clientName].selected
      }
    } else {
      ls = {};
      for (let clientName in global.cn.clients) {
        console.log(f, 'initialize localStorage ', clientName)
        if (!ls[clientName]) ls[clientName] = {}
        ls[clientName].selected = true
        global.cn.clients[clientName].selected = true
      }
      localStorage.setItem(lsKey, JSON.stringify(ls))
    }
    console.log(f,'exit', ls)
  }, [])

  const onChangeH = event => {
    console.log('MqttFilterClient::onChangeH',event.target.checked)
    global.cn.clients[event.target.id]['selected'] = event.target.checked

    let ls = JSON.parse(localStorage.getItem(lsKey))
    if (!ls[event.target.id]) {
      ls[event.target.id] = {}
    }
    ls[event.target.id]['selected'] = event.target.checked
    localStorage.setItem(lsKey, JSON.stringify(ls))

    props.onChangeH(event);
  }

  return (
    <div className="mqtt-filter-client">
      <h3>Client</h3>
      <div className="select mqtt-client-bg">
        <CheckboxList list={global.cn.clients} onChangeH={onChangeH} />
      </div>
    </div>
  );
}

export default MqttFilterClient