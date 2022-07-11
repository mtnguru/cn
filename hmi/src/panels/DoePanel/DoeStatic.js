import DoeElement from './DoeElement'
import ('./DoeStatic.scss')

const DoeStatic = (props) => {

  return (
    <tr className="doe-static">
      <td key="id">{props.run.id}</td>
      {Object.keys(props.run.static).map(name => {
        return <DoeElement element={props.variables[variable]} variable={variable} />
      })}
    </tr>
  )
}
/*
{Object.keys(props.run.variables).map(variable => {
  return <td key={`${props.run.id}-${variable}`}>{props.run.variables[variable]}</td>
})}
 */

export default DoeStatic