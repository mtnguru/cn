import './Button.scss'

function Button(props) {
  return <button className={`button ${props.className}`} id={props.id} onClick={props.onClick}>{props.label}</button>
}

export default Button;