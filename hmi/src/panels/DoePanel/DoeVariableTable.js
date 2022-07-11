import React, {useState, useEffect} from 'react'
import DoeRun from './DoeRun'
import ControlStats from "../ControlPanel/ControlStats";

import './DoeVariableTable.scss'

const DoeVariableTable = (props) => {
  const [doe, setDoe] = useState(props.doe)
  useEffect(() => {
    setDoe(props.doe)
  }, [props.doe])

  const metricCB = (metric, topic, payload, tags, values) => {
    if (props.metricCB)  {
      props.metricCB(metric, topic, payload, tags, values)
    }
  }

  const VariableTableHeader = () => {
    if (props.doe == null) return ''
    return (
      <tr>
        <th key="run"></th>
        {Object.keys(props.doe.variables).map(variable => {
          return (
            <th key={variable}>
              <ControlStats metricName={variable} metricCB={metricCB} type="status" label={props.doe.variables[variable].label} />
            </th>
          )
        })}
      </tr>
    )
  }

  return (
    <section className="table doe-variable">
      <h3>DOE Runs</h3>
      <table className='doe-list'>
        <thead>
          <VariableTableHeader />
        </thead>
        <tbody>
          {doe.runs.map(run => {
            return <DoeRun key={run.id} run={run} />
          })}
        </tbody>
      </table>
    </section>
  )
}
/*
*/

export default DoeVariableTable