import React from 'react'
import './Input.scss'

function Input (props) {

  return (
    <div className={`input ${props.input.id}`} key={`${props.input.id}`}>
      <label htmlFor={props.input.id}>{props.input.label}</label>
      <textarea onChange={props.onChange} {...props.input} />
    </div> )
}
export default Input;