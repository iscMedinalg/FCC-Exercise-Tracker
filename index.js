const express = require('express')
const app = express()
const mongoose = require('mongoose')
const cors = require('cors')
const bodyParser = require('body-parser')
require('dotenv').config()

mongoose.connect(process.env.MONGO_URI, { useUnifiedTopology: true, useNewUrlParser: true })

//Schemas
const { Schema } = mongoose;

const userSchema = new Schema({
  "username": String,
})

const exerciseSchema = new Schema({
  "username": String, 
  "description": String,
  "duration": Number,
  "date": Date,
})

const logSchema = new Schema ({
  "username": String,
  "count": Number,
  "log": Array
})

//models
const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);
const Log = mongoose.model('Log', logSchema)

//middleware
app.use(express.urlencoded({extended: false}))
app.use(express.json())
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users',  (req, res) => {
  User.find({"username": req.body.username}, (err, userData) => {
    if(err) {
      err.send("Error with the server")
    } else {
      if(userData.length === 0){
        const test = new User({
          "_id": req.body.id,
          "username": req.body.username,
        })

        test.save((err, data) => {
          if(err){ 
            err.send("Error saving data")
          } else {
            res.json({
              "_id": data.id,
              "username": data.username
            })
          }
        })
      } else {
        res.send("Username already exists")
      }
    }

  })
})

app.post('/api/users/:_id/exercises', (req, res) => {
  let idJson = { "id": req.params._id};
  let checkedDate = new Date(req.body.date);
  let idToCheck = idJson.id;

  let noDateHandler = () => {
    if(checkedDate instanceof Date && !isNaN(checkedDate)){
      return checkedDate
    } else {
      checkedDate = new Date()
    }
  }
  User.findById(idToCheck, (err, data) => {
    noDateHandler(checkedDate)

    if(err){
      err.send("Error with ID")
    } else {
      const test = new Exercise({
        "username": data.username,
        "description": req.body.description,
        "duration": req.body.duration,
        "date": checkedDate.toDateString()
      })

      test.save((err, data) => {
        if(err){
          err.send("error saving")
        } else {
          res.json({
            "_id": idToCheck,
            "username": data.username,
            "description": data.description,
            "duration": data.duration,
            "date": data.date.toDateString()
          })
        }
      })
    }
  })
  
})

app.get('/api/users/:_id/logs', (req, res) => {
  const {from, to, limit} = req.query
  let idJson = {"id": req.params._id}
  let idToCheck = idJson.id

  User.findById(idToCheck, (err, data) => {
    var query = {
      username: data.username
    }

    if(from !== undefined && to === undefined){
      query.date = { $gte: new Date(from)}
    } else if(to !== undefined && from === undefined){
      query.date = { $lte: new Date(to)}
    } else if(from !== undefined && to !== undefined){
      query.date = { $gte: new Date(from), $lte: new Date(to)}
    }

    let limitChecker = (limit) => {
      let maxLimit = 100
      if(limit){
        return limit
      } else {
        return maxLimit
      }
    }
    if(err){
      err.send("error with ID")
    } else {
      
      Exercise.find((query), null, {limit: limitChecker(+limit)}, (err, docs) => {
        let loggedArray = [];
        if(err){
          err.send("error with query")
        } else {
          let documents = docs;
          let loggedArray = documents.map((item) => {
            return {
              "description": item.description,
              "duration": item.duration,
              "date": item.date.toDateString()
            }
          })

          const test = new Log({
            "username": data.username,
            "count": loggedArray.length,
            "log": loggedArray
          })

          test.save((err, data) => {
            if(err){
              err.send("error saving exercise")
            } else {
              res.json({
                "_id": idToCheck,
                "username": data.username,
                "count": data.count,
                "log": loggedArray
              })
            }
          })
        }
      })
    }
  })
})

app.get('/api/users', (req, res) => {
  User.find({}, (err, data) => {
    if(err){
      err.send("No user found")
    } else {
      res.json(data)
    }
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
