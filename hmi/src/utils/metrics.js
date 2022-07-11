// metric.js -

const findMetric = (metricName) => {
//const f = "metrics::findMetric"
  let metric = global.aaa.metrics[metricName.toLowerCase()]
  if (metric)  {
    return metric;
  }
  return null;
}

const getValue = (metric) => {
  if (metric.input  && metric.input.value)  return metric.input.value
  if (metric.output && metric.output.value) return metric.output.value
  if (metric.user   && metric.user.value)   return metric.user.value
  return "MV"
}

const c2f = c => { return c * 1.8 + 32 }

const f2c = f => { return (f - 32) / 1.8 }

module.exports.findMetric = findMetric
module.exports.getValue = getValue
module.exports.c2f = c2f
module.exports.f2c = f2c