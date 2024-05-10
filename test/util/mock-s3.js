const events = require('events')

function createMockS3 () {
  function send (opts, cb) {
    const ee = new events.EventEmitter()
    const buffer = opts.input.Body
    ee.emit('httpUploadProgress', { total: buffer.length })
    return Promise.resolve({
      Location: 'mock-location',
      ETag: 'mock-etag'
    })
  }

  return { send, config: { endpoint: () => ({ protocol: 'https', hostname: 'hostname' }) } }
}

module.exports = createMockS3
