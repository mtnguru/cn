import './GrafanaPanel.module.scss'

const GrafanaPanel = (props) => {
//const clickH = (event) => {
//  console.log('clickH', event.target);
//}

  const url = "http://v2:8004/d/l1vyONNnk/safire?orgId=1"
//const url = "http://itsallelectric.org:3000/d/ZG-MWKI7k/cabin-epic-rio-learning-center?orgId=1&from=now-24h&to=now&refresh=5s"
//const url = "https://snapshot.raintank.io/dashboard-solo/snapshot/y7zwi2bZ7FcoTlB93WN7yWO4aMiz3pZb?from=1493369923321&to=1493377123321&panelId=4"
//const url = "tsallelectric.org:3000/d/ZG-MWKI7k/cabin-epic-rio-learning-center?orgId=1&from=now-24h&to=now&refresh=5s"
  return (
    <div className="panel grafana-panel mqtt-client-bg">
      <iframe
        title="meltdown"
        src={url}
        width="650" height="500" frameborder="0">
      </iframe>
    </div>
  )
}

export default GrafanaPanel