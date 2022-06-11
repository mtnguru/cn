import './Button.scss'

function Button(props) {
  return <button className="button" onClick={props.onclick}>{props.name}</button>
}

export default Button;