const pem = require('pem')
const express = require('express')
const https = require('https')
const service = require('./services/service')

console.log('==================================')
pem.createCertificate({days:1, selfSigned:true}, function(err, keys) {
  if (err) {
    throw err
  }
  const app = express()

  app.set('view engine', 'ejs')
  app.use(express.static(__dirname + '/public'))
  app.get('*', function(req,res) {
    res.render('index')
  })

  const webserver = https.createServer({key: keys.serviceKey, cert: keys.certificate}, app)

  service(webserver)

  const settings = require('./settings.json')
  console.log(`settings: ${JSON.stringify(settings)}`)

  let mode = null
  if (process.argv.length == 2 || process.argv[2] == 'dev') {
    console.log('mode: development')
    mode = settings.development
  } else if (process.argv[2] == 'real') {
    console.log('mode: production')
    mode = settings.production
  }
  
  webserver.listen(mode.port, mode.host, function() {
    console.log(`server is listening on https://${mode.host}:${mode.port}`)
    console.log('==================================')
  })
})