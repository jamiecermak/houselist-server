const { PayloadValidator } = require('../middleware/PayloadValidator')
const yup = require('yup')
const { AuthenticationLib } = require('../lib/Authentication')
const { SuccessResponse } = require('../util/APIResponses')
const { ErrorHandler } = require('../middleware/ErrorHandler')
const { AuthorisationLib } = require('../lib/Authorisation')
const router = require('express').Router()

router.post(
    '/login',
    PayloadValidator(
        yup
            .object()
            .shape({
                username: yup
                    .string()
                    .max(255, 'Username must be 255 characters or less')
                    .required('Password is required'),
                password: yup
                    .string()
                    .max(255, 'Password must be 255 characters or less')
                    .required('Password is required'),
            })
            .noUnknown(true, 'Unknown options')
            .strict(true),
    ),
    ErrorHandler(async (req, res) => {
        const { username, password } = req.payload.body

        const authentication = new AuthenticationLib()
        const authorisation = new AuthorisationLib()

        const userId = await authentication.authenticateUser(username, password)
        const token = authorisation.generateJWT(userId)

        const response = new SuccessResponse({ token })
        response.send(res)
    }),
)

module.exports = {
    AuthenticationRoutes: router,
}
