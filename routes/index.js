// eslint-disable-next-line no-unused-vars
const { Express } = require('express')
const { AppErrorHandler } = require('../middleware/AppErrorHandler')
const { PathNotFoundHandler } = require('../middleware/PathNotFoundHandler')
const { AuthenticationRoutes } = require('./AuthenticationRoutes')
const bodyParser = require('body-parser')
const { UserRoutes } = require('./UserRoutes')

/**
 * Main Houselist Route Handler
 *
 * @param {Express} app
 */
function HouselistApp(app) {
    app.get('/', (req, res) => {
        res.sendStatus(200)
    })

    app.use(bodyParser.json())

    app.use('/auth', AuthenticationRoutes)
    app.use('/user', UserRoutes)

    app.use(PathNotFoundHandler)

    app.use(AppErrorHandler)
}

module.exports = {
    HouselistApp,
}
