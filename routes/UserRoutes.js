const { SuccessResponse } = require('../util/APIResponses')
const { ErrorHandler } = require('../middleware/ErrorHandler')
const { IsAuthorised } = require('../middleware/IsAuthorised')
const { UsersLib } = require('../lib/Users')
const router = require('express').Router()

router.get(
    '',
    IsAuthorised,
    ErrorHandler(async (req, res) => {
        const users = new UsersLib()

        const user = await users.getActiveUserById(req.user.id)

        const response = new SuccessResponse(user)
        response.send(res)
    }),
)

module.exports = {
    UserRoutes: router,
}
