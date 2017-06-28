const bodyParser = require('body-parser')
const express = require('express')
const proxy = require('express-http-proxy')
const request = require('request')
const shuffle = require('shuffle-array')

const config = require('./config')
const utils = require('./utils')


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


app.post('/commands/lucky-wheel', (req, res) => {
  let payload = req.body

  // Token verification
  if (!payload || payload.token !== config('SLACK_COMMAND_TOKEN')) {
    let err = 'Invalid token'
    console.log(err)
    res.status(401)
      .end(err)
    return
  }

  let text = payload.text
  let message = {
    reponse_type: '',
    text: ''
  }

  // Check if empty or contains only spaces
  if (!text.replace(/\s/g, '')
    .length) {
    message.response_type = 'ephemeral'
    message.text = 'Try again with /lucky-wheel "Who is the best?" Apple Google'
    res.status(200)
      .json(message)
    return
  }

  // Replace quotes
  text = text.replace(/“/g, '"')
  text = text.replace(/'/g, '"')

  // Parse question between quotes
  let re = /\"([^)]+)\"/
  let match = text.match(re)
  let question = ''
  if (match) {
    question = match[1]
  }

  // Parse players
  let players = text.replace(re, '')
    .split(/[ ]+/)
    .filter(Boolean)

  if (players.length < 2) {
    message.response_type = 'ephemeral'
    message.text = 'Not enough players.'
    res.status(200)
      .json(message)
    return
  }

  message.response_type = 'in_channel'
  message.text = question
  message.attachments = [
    {
      title: 'Rolling',
      image_url: 'https://media.giphy.com/media/lGocIxGhfcly/giphy.gif'
    }
  ]

  res.status(200)
    .json(message)

  let winner = shuffle.pick(players)
  let winner_message = {
    response_type: 'in_channel',
    text: 'And the winner is... ' + winner + '!!!'
  }
  let options = {
    url: payload.response_url,
    method: 'POST',
    body: winner_message,
    json: true
  }
  utils.sleep(4)
    .then(
      () => request(options)
    )

})

app.listen(config('PORT'), (err) => {
  if (err) throw err

  console.log(`\n🚀 LUCKY WHEEL LIVES on PORT ${config('PORT')} 🚀`)

})
