const { PayloadValidator } = require('../middleware/PayloadValidator')
const yup = require('yup')
const { AuthenticationLib } = require('../lib/Authentication')
const { SuccessResponse } = require('../util/APIResponses')
const { ErrorHandler } = require('../middleware/ErrorHandler')
const { AuthorisationLib } = require('../lib/Authorisation')
const { onSignup } = require('../events/onSignup')
const router = require('express').Router()

/**
 * POST /auth/login
 *
 * Sign in with a Username and Password
 */
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

/**
 * POST /auth/signup
 *
 * Signup to Houselist with a Username, Email Address, Username and Password
 */
router.post(
    '/signup',
    PayloadValidator(
        yup
            .object()
            .shape({
                name: yup
                    .string()
                    .max(255, 'Name must be 255 characters or less')
                    .required('Name is required'),
                email_address: yup
                    .string()
                    .email('Invalid Email Address')
                    .required('Email address is required'),
                username: yup
                    .string()
                    .max(255, 'Username must be 255 characters or less')
                    .required('Username is required'),
                password: yup
                    .string()
                    .max(255, 'Password must be 255 characters or less')
                    .required('Password is required'),
            })
            .noUnknown(true, 'Unknown options')
            .strict(true),
    ),
    ErrorHandler(async (req, res) => {
        const { username, password, name, email_address } = req.payload.body

        const authentication = new AuthenticationLib()

        const newUserId = await authentication.signup(
            name,
            username,
            email_address,
            password,
        )

        await onSignup(newUserId)

        const response = new SuccessResponse()
        response.send(res)
    }),
)

module.exports = {
    AuthenticationRoutes: router,
}
