import React, {useState, useEffect} from 'react';
import Card from '../../components/ui/Card'
import ('./MqttItem.scss')

const extractFromTags = require('../../utils/influx')

const MqttItem = (props) => {
  const [payloadOut, setPayloadOut] = useState('')

  // Format the payload - Raw, JSON, Pretty
  useEffect(() => {
    let payloadStr = props.item.payload         // Display the Raw payload

    if (props.pretty !== 'Raw') {
      if (props.item.action === 'configReq') {
        payloadStr = 'Request Configuration - who am I'
      } else if (props.item.action === 'reset') {
        payloadStr = 'Request Reset'
      } else {
        if (props.item.payload[0] === '{') {    // if this payload is JSON
          const payload = JSON.parse(props.item.payload);
          payloadStr = JSON.stringify(payload, null, 3)
          if (props.pretty === "Pretty") {
            if (payload.content) {
              payloadStr = `${payload.function} - ${payload.content}`
            } else if (props.item.type === 'output') {
              payloadStr = `${payload.metric} - ${payload.value}`
            } else {
              payloadStr = payloadStr
                .replace(/"|/g, '')         // remove all double quotes

                .replace(/^{\n/, '')        // remove opening {
                .replace(/}$/, '')          // remove closing }

                .replace(/,\n/g, '\n')      // remove all trailing commas
                .replace(/\n\s*[\]}]\n/g, '\n') // remove all } on a line by themselves
                .replace(/\n\s*[\]}]\n/g, '\n') // do it a second time
                .replace(/: [[{]\n/g, ':\n');  // remove all trailing
            }
          }
        } else if (props.pretty === "Pretty" &&
               (props.item.type === 'input' || props.item.type === 'user' || props.item.type === 'output')) {
          let {tags, values} = extractFromTags(props.item.payload)
          payloadStr = `${tags["Metric"]} -- ${values["value"]}`
        } else if (props.item.type === 'admin') {
          if (props.item.action === 'configReq') {
            payloadStr = 'Request configuration - who am I and why am I here?'
          }
        }
      }
    }
    setPayloadOut(payloadStr)
  }, [props.item.action, props.item.type, props.item.payload, props.pretty])

  return (
    <div className='mqtt-item mqtt-type-bg'>
      <Card type={props.item.type} className={props.pretty}>
        <div className='right'>
          <span className='date'>{props.item.date}</span>
          <span className='nitems'>{props.item.nitems.toString()}</span>
        </div>
        <div className={`left mqtt-client-bg`}>
          <span className={`source ${props.item.source}`}>{props.item.source}</span>
          <span className='topic'>{props.item.topic}</span>
        </div>
        <pre><code className='payload'>{payloadOut}</code></pre>
      </Card>
    </div>
  )
}

export default MqttItem