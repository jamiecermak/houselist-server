// eslint-disable-next-line no-unused-vars
const { Express } = require('express')
const { AppErrorHandler } = require('../middleware/AppErrorHandler')
const { PathNotFoundHandler } = require('../middleware/PathNotFoundHandler')
const { AuthenticationRoutes } = require('./AuthenticationRoutes')
const bodyParser = require('body-parser')
const { UserRoutes } = require('./UserRoutes')
const { DeviceRoutes } = require('./DeviceRoutes')
const { ListRoutes } = require('./ListRoutes')
const { ListMemberRoutes } = require('./ListMemberRoutes')

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
    app.use('/device', DeviceRoutes)
    app.use('/list', ListRoutes)
    app.use('/list', ListMemberRoutes)

    app.use(PathNotFoundHandler)

    app.use(AppErrorHandler)
}

module.exports = {
    HouselistApp,
}
