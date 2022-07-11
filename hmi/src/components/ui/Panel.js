import './Panel.scss'

function Panel(props) {
  return <section className={`panel ${props.type} ${props.className}`}>{props.children}</section>
}

export default Panel