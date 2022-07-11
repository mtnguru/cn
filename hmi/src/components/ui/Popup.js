import React, {Fragment} from 'react'
import ReactDOM from 'react-dom'

import classes from './Popup.module.scss'

const PopupOverlay = (props) => {
  return (
    <div className={classes.modal}>
      <div className={classes.content}>{props.children}</div>
    </div>
  )
}

const portalElement = document.getElementById('overlays');

const Popup = (props) => {
  return (
    <Fragment>
      {ReactDOM.createPortal(<PopupOverlay>{props.children}</PopupOverlay>, portalElement)}
    </Fragment>
  )
}

export default Popup;