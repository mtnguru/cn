import React, {useEffect, useState} from 'react'

import DoeElement from "./DoeElement";
import ControlStats from "../ControlPanel/ControlStats";

import './DoeStaticTable.scss'

const DoeStaticTable = (props) => {
  const [doe, setDoe] = useState(props.doe)

  useEffect(() => {
    setDoe(() => {return props.doe})
  }, [props.doe])

  const metricCB = (metric, topic, payload, tags, values) => {
    if (props.metricCB) {
      props.metricCB(metric,topic, payload, tags, values)
    }
  }

  const StaticTableHeader = () => {
    if (doe == null) return <tr><td></td></tr>
    return (
      <tr>
        {Object.keys(props.doe.static).map(xstatic => {
          return (
            <th key={xstatic}>
              <ControlStats metricName={xstatic} metricCB={metricCB}/>
            </th>
          )
        })}
      </tr>
    )
  }

  return (
    <section className="table doe-static">
      <h3>Static Metrics</h3>
      <table className='doe-list'>
        <thead>
        <StaticTableHeader />
        </thead>
        <tbody>
          <tr key="dude">
            {Object.keys(doe.static).map(metricName => {
            return <DoeElement key={metricName} element={doe.static[metricName]} metricName={metricName} />
          })}
          </tr>
        </tbody>
      </table>
    </section>
  )
}
/*
*/

export default DoeStaticTable