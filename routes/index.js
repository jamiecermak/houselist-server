const { Express } = require('express')

/**
 * Main Houselist Route Handler
 *
 * @param {Express} app
 */
function HouselistApp(app) {
    app.get('/', (req, res) => {
        res.sendStatus(200)
    })
}

module.exports = {
    HouselistApp,
}
