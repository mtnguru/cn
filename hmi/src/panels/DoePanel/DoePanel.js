import React, {useState, useEffect} from 'react'
import {mqttReqFile} from "../../utils/mqttReact"
import Panel from "../../components/ui/Panel"
import DoeStaticTable from "./DoeStaticTable"
import DoeVariableTable from "./DoeVariableTable"

import './DoePanel.scss'

const DoePanel = (props) => {
  const [doe, setDoe] = useState({
    runs: [],
    static: {},
    variables:{}
  })

  const onLoadCB = (topic, payload) => {
    let doe = global.aaa.doe = payload;
    doe.runs = [];
    // Create new structure - runs[variable][value]
    for (let r = 0; r < doe.numberRuns; r++) {
      doe.runs.push({
        id: r,
        variables: {}
      })
      for (let variable in doe.variables) {
        doe.runs[r].variables[variable] = {
          value: doe.variables[variable][r],
        }
      }
    }
    setDoe(doe)
  }

  useEffect(() => {
    mqttReqFile('doe-1', 'doe/doe-1.json', onLoadCB)
  }, [])
  return (
    <Panel className="panel doe-panel">
      <h2>{props.title}</h2>
      <DoeStaticTable doe={doe} />
      <DoeVariableTable doe={doe} />
    </Panel>
  )
}
/*
*/

export default DoePanel
