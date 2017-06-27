const express = require('express')
const proxy = require('express-http-proxy')
const bodyParser = require('body-parser')
const config = require('./config')


let app = express()

if (config('PROXY_URI')) {
  app.use(proxy(config('PROXY_URI'), {
    forwardPath: (req, res) => {
      return require('url')
        .parse(req.url)
        .path
    }
  }))
}

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
