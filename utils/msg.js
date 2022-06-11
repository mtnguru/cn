//require('dotenv').config();
var mqtt_cn = require('./mqtt_cn');

const pubErrorMsg = (func, msg, err) => {
  let payload = {
    type: "error",
//  program: global.program,
    function: func,
    msg: msg,
    error: err,
  }
  let jpayload = JSON.stringify(payload);
  mqtt_cn.send('edge/error', jpayload);
  console.log(func, 'ERROR:', msg, err);
}

module.exports.pubErrorMsg = pubErrorMsg