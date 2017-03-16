const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const routes = require('./routes')
const pg = require('pg')
const axios = require('axios')
// line const connString = 'postgres://poztqmtwsusjtl:110b831a16b196e24c03785e1c3ad5b2c9e5f16b0fcc4cdec1391561c4920a2f@ec2-23-21-224-106.compute-1.amazonaws.com:5432/df4np0hds8r4s2'
const connString = 'postgres://fpgmqsestpymmo:59673047da6830360ad4fcfd777fa79c7a1cd0c8455e2cf985f8d2c066f73b3c@ec2-54-225-230-243.compute-1.amazonaws.com:5432/d5301p41vpcsdu'
const moment = require('moment')
app.use(bodyParser.json())

app.set('port', (process.env.PORT || 4000))
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
pg.defaults.ssl = true

app.use(express.static('public'))
var rpi = ''
pg.connect(connString, function (err, client, done) {
  if (err) response.send('Could not connect to DB: ' + err)
  // client.query('insert into test values (1,"koy")')
  client.query('SELECT * FROM rpi', function (err, rpiData) {
    done()
    if (err) console.log(err)
    //  console.log(result.rows[0].no)
    // console.log(result.rows.length)
    rpi = rpiData.rows[rpiData.rows.length-1]
    console.log(rpi)
  })
})

app.use('/api', routes)

// app.get('/', (req, res) => {
//   res.send('<h1>Next INT</h1>')
// })

app.get('/kkk', (req , res) => {
  axios.get('http://api.wunderground.com/api/17ccfc69f85dc3e5/conditions/q/TH/Bangkok.json').then((response) => {
    const data  = response.data
    console.log(data.current_observation.relative_humidity)
    console.log(data.current_observation.weather)
    console.log(data.current_observation.pressure_mb)
    // res.send(response.data)
    pg.connect(connString, function (err, client, done) {
      if (err) res.send('Could not connect to DB: ' + err)
      // client.query('insert into test values (1,"koy")')
      client.query(`insert into wether_api (condition, pressure, humidity) values ('${data.current_observation.weather}', '${data.current_observation.pressure_mb}', '${data.current_observation.relative_humidity}')`, function (err, result) {
        done()
        if (err) return console.log(err)
        // console.log(result.rows)
        if (!err) return console.log('add done')
        // res.send(result.rows)
      })
    })
  })
})


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
  } else if (text == 'now') {
    axios.get('http://api.wunderground.com/api/17ccfc69f85dc3e5/conditions/q/TH/Bangkok.json').then((response) => {
      console.log(response.data.current_observation.relative_humidity)
      console.log(response.data.current_observation.weather)
      console.log(response.data.current_observation.pressure_mb)
      pg.connect(connString, function (err, client, done) {
        if (err) res.send('Could not connect to DB: ' + err)
        // client.query('insert into test values (1,"koy")')
        client.query(`insert into wether_api (condition, pressure, humidity) values ('${response.data.current_observation.weather}', '${response.data.current_observation.pressure_mb}', '${response.data.current_observation.relative_humidity}')`, function (err, result) {
          done()
          if (err) return console.log(err)
          // console.log(result.rows)
          if (!err) return console.log('add done')
          // res.send(result.rows)
        })
      })
      pg.connect(connString, function (err, client, done) {
        if (err) response.send('Could not connect to DB: ' + err)
        // client.query('insert into test values (1,"koy")')
        client.query('SELECT * FROM rpi', function (err, rpiData) {
          done()
          if (err) console.log(err)
          //  console.log(result.rows[0].no)
          // console.log(result.rows.length)
          rpi = rpiData.rows[rpiData.rows.length-1]
          console.log(rpi)
        })
      })
      setTimeout(() => {
        sendText(sender, 'ความชื่นดิน :'+ rpi.adc_data +'%\n สภาพอากาศ : ' + response.data.current_observation.weather + '\n ความกดดันอากาศ : ' + response.data.current_observation.pressure_mb + 'pha\n ความชื่นอากาศ : ' + response.data.current_observation.relative_humidity + '\n อุณหภูมิ : ' + response.data.current_observation.temp_c)
        sendImage(sender, rpi.image_url)
      }, 1000)
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

function sendImage (sender, url) {
  let data = {
    to: sender,
    messages: [
      {
        type: "image",
        originalContentUrl: url,
        previewImageUrl: url
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

function toTime (timestamp) {
  return moment(timestamp).format('DD MM YYYY h');
}

app.listen(app.get('port'), function () {
  console.log('run at port', app.get('port'))
})
