import './Card.scss'

function Card(props) {
  return <div className={`card ${props.type} ${props.className}`}>{props.children}</div>

}

export default Card;