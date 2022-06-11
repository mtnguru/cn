
const extract = (payload) => {
//const f = "mqtt.js::extractInfluxTags"
  const [tagStr,valueStr,time] = payload.split(' ')

  const valueA = valueStr.split(',')
  let values = {}
  for (let t = 0; t < valueA.length; t++) {
    const [name, value] = valueA[t].split('=')
    values[name] = value;
//  console.log(f, "add tag", name, value)
  }

  const tagA = tagStr.split(',')
  let tags = {}
  for (let t = 0; t < tagA.length; t++) {
    const [name, value] = tagA[t].split('=')
    tags[name] = value;
//  console.log(f, "add tag", name, value)
  }

  return {tags, values, time}
}

module.exports.extract = extract
