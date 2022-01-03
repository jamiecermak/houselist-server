const serverless = require('serverless-http')
const express = require('express')
const { HouselistApp } = require('./routes')
const app = express()

HouselistApp(app)

module.exports.app = app
module.exports.handler = serverless(app)
