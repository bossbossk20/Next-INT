const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const axios = require('axios')
const app = express()
const instance = axios.create({
  baseURL: 'https://api.line.me/v2/bot/message',
  timeout: 1000,
  headers: {'X-Custom-Header': 'foobar'}
});
app.use(bodyParser.json())

app.set('port', (process.env.PORT || 4000))
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.send('test')
})

app.post('/webhook', (req, res) => {
  var text = req.body.events[0].message.text
  var sender = req.body.events[0].source.userId
  var replyToken = req.body.events[0].replyToken
  console.log(text, sender, replyToken)
  console.log(typeof sender, typeof text)
  // console.log(req.body.events[0])
  if (text === 'สวัสดี' || text === 'Hello' || text === 'hello') {
    sendText(sender, text)
  }
  res.sendStatus(200)
})

function sendText (sender, text) {
  let data = {
    to: sender,
    messages: [
      {
        type: 'text',
        text: 'สวัสดีค่ะ เราเป็นผู้ช่วยปรึกษาด้านความรัก สำหรับหมามิ้น 💞'
      }
    ]
  }

  axios.post('/push', data).then((res) => {
    console.log(res)
  })
  // request({
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': 'Bearer RB8fheVRXK2Tckel5O4OU80MHWFanHJnfpR+4sjBkWp5dCZpgLR1ofUW5p2Vymk5USUmf8SVhW3i5BYDeqMOeCwcbmDgrJl5go1T7mBwsuQIeX2+HNOnigbxpIqaQ8lTpeGuk/9iMIlPB+pyXIaZlwdB04t89/1O/w1cDnyilFU='
  //   },
  //   url: 'https://api.line.me/v2/bot/message/push',
  //   method: 'POST',
  //   body: data,
  //   json: true
  // }, function (err, res, body) {
  //   if (err) console.log('error')
  //   if (res) console.log('success')
  //   if (body) console.log(body)
  // })
}

app.listen(app.get('port'), function () {
  console.log('run at port', app.get('port'))
})
