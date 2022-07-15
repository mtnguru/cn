import * as React from "react";
import { Link } from "react-router-dom";
import classes from './MainNavigation.module.scss';

function MainNavigation() {
  return (
    <header className={classes.header}>
      <div className={classes.logo}><h2>LabTime - HMI</h2></div>
      <nav>
        <ul>
          <li key="home"><Link to='/'>Experiment</Link></li>
          <li key="mqtt"><Link to='/mqtt'>MQTT</Link></li>
          <li key="doe"><Link to='/doe'>DOE</Link></li>
          <li key="admin"><Link to='/admin'>Admin</Link></li>
          <li key="grafana"><Link to='/grafana'>Grafana</Link></li>
          <li key="play"><Link to='/play'>Play</Link></li>
        </ul>
      </nav>
    </header>
  )
}

export default MainNavigation;