import React, {useState} from 'react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import {mqttPublish} from '../../utils/mqttReact'
import ('./DoeForm.scss')

const DoeForm = (props) => {
  const [notes, setNotes] = useState('')

  const onChange = event => {
    console.log('onChange - ', event.target.value)
    setNotes(prevNotes => {
      return event.target.value
    })
  }

  const submitH = event => {
    const f = "DoeForm::submitH"
    event.preventDefault()
    console.log(f, 'notes ', notes)
    props.payload.notes = notes;
    const topic = 'lab1/doe/post/hmi1'
    mqttPublish(topic,JSON.stringify(props.payload))
    props.closeH(event)
  }

  const cancelH = event => {
    event.preventDefault()
    if (props.closeH) {
      props.closeH(event)
    }
  }

  return (
    <form className="doe-form">
      <div className="doe-expt">Experiment: 42</div>
      <div className="doe-date">Date: {props.payload.date}</div>
      <div className="doe-run">Run: {props.payload.runId}</div>
      <div className="doe-notes-label">Notes:</div>
      <Input onChange={onChange}
        input={{
          wrap: "true",
          type: "textarea",
          name: "notes",
          size: 60,
          lines: 6,
          id: "doe-form-notes",
//        defaultValue: {value},
        }}
      />
      <pre><code>Payload: {JSON.stringify(props.payload, null, 3)}</code></pre>
      <div className="doe-actions">
        <Button type="push" className="submit" label="Submit" onClick={submitH} />
        <Button type="push" className="cancel" label="Cancel" onClick={cancelH} />
      </div>
    </form>
  )
}

export default DoeForm