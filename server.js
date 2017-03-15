const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const routes = require('./routes')
const pg = require('pg')
const axios = require('axios')
const connString = 'postgres://poztqmtwsusjtl:110b831a16b196e24c03785e1c3ad5b2c9e5f16b0fcc4cdec1391561c4920a2f@ec2-23-21-224-106.compute-1.amazonaws.com:5432/df4np0hds8r4s2'

app.use(bodyParser.json())

app.set('port', (process.env.PORT || 4000))
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
pg.defaults.ssl = true

app.use(express.static('public'))

pg.connect(connString, function (err, client, done) {
  if (err) response.send('Could not connect to DB: ' + err)
  // client.query('insert into test values (1,"koy")')
  client.query('SELECT * FROM next_int', function (err, result) {
    done()
    if (err) return response.send(err)
    console.log(result.rows)
  })
})

app.use('/api', routes)

// app.get('/', (req, res) => {
//   res.send('<h1>Next INT</h1>')
// })

app.get('/save_temp', (req , res) => {
  let days = [10,11,12,13,14]
  let allDays = []
  days.map((item) => {
    axios.get(`http://api.wunderground.com/api/17ccfc69f85dc3e5/history_201703${item}/q/TH/bangkok.json`).then((response) => {
      // res.send(response.data)
      allDays.push(response.data)
    })
  })
  setTimeout(function () {
    res.send(allDays)
    allDays.map((day) => {
      const date = day.history.date.mday.toString() +'_'+day.history.date.mon.toString()+'_'+day.history.date.year.toString()
      console.log(day.history.dailysummary[0].meantempm + '\n' + date )
      pg.connect(connString, function (err, client, done) {
        if (err) response.send('Could not connect to DB: ' + err)
        // client.query('insert into test values (1,"koy")')
        client.query(`insert into temperature (day, month, year, temperature) values (${day.history.date.mday}, ${day.history.date.mon}, ${day.history.date.year}, ${day.history.dailysummary[0].meantempm})`, function (err, result) {
          done()
          if (err) return res.send(err)
          console.log('add done')
        })
      })
    })
    // pg.connect(connString, function (err, client, done) {
    //   if (err) response.send('Could not connect to DB: ' + err)
    //   // client.query('insert into test values (1,"koy")')
    //   client.query('SELECT * FROM next_int', function (err, result) {
    //     done()
    //     if (err) return response.send(err)
    //     console.log(result.rows)
    //   })
    // })
  }, 1000)
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
  } else if (text === 'เหนื่อยไหม') {
    pg.connect(connString, function (err, client, done) {
      if (err) response.send('Could not connect to DB: ' + err)
      // client.query('insert into test values (1,"koy")')
      client.query('SELECT * FROM temperature', function (err, result) {
        done()
        if (err) return response.send(err)
        // console.log(result.rows)
        // res.send(result.rows)

        result.rows.map((item) => {
          // console.log(i.day)
          console.log(item)
          console.log(item.day + '/' + item.month + '/' + item.year +'\n temperature : ' + item.temperature)
            sendText(sender, item.day + '/' +item.month + '/' + item.year +'\n temperature : ' + item.temperature)
        })
        // sendText(sender, result.rows[0])
      })
    })
  }
})

app.get('/temp_data' , (req , res) => {
  pg.connect(connString, function (err, client, done) {
    if (err) response.send('Could not connect to DB: ' + err)
    // client.query('insert into test values (1,"koy")')
    client.query('SELECT * FROM temperature', function (err, result) {
      done()
      if (err) return response.send(err)
      // console.log(result.rows)
      res.send(result.rows)
      result.rows.map((item) => {
        console.log(item.day + '/' +item.month + '/' + item.year +'\n temperature : ' + item.temperature)
          // sendText(sender, result.rows[0].day + '/' +result.rows[0].month + '/' + result.rows[0].year +'/n temperature : ' + result.rows[0].temperature)
      })
      // sendText(sender, result.rows[0])
    })
  })
})

function sendText (sender, text) {
  let data = {
    to: sender,
    messages: [
      {
        type: 'text',
        text: text
      }
    ]
  }

  request({
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer RB8fheVRXK2Tckel5O4OU80MHWFanHJnfpR+4sjBkWp5dCZpgLR1ofUW5p2Vymk5USUmf8SVhW3i5BYDeqMOeCwcbmDgrJl5go1T7mBwsuQIeX2+HNOnigbxpIqaQ8lTpeGuk/9iMIlPB+pyXIaZlwdB04t89/1O/w1cDnyilFU='
    },
    url: 'https://api.line.me/v2/bot/message/push',
    method: 'POST',
    body: data,
    json: true
  }, function (err, res, body) {
    if (err) console.log('error')
    if (res) console.log('success')
    if (body) console.log(body)
  })
}

app.listen(app.get('port'), function () {
  console.log('run at port', app.get('port'))
})
