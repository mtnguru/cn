import React from 'react'
import './Checkbox.scss'

function Checkbox (props) {

  return (
    <div className={`checkbox ${props.id}`} key={`${props.id}`}>
      <input id={props.id} type='checkbox' name={props.id} onChange={props.onChangeH} checked={props.selected ? "checked" : ""} />
      <label htmlFor={props.id}>{props.name}</label>
    </div> )
}
export default Checkbox;

