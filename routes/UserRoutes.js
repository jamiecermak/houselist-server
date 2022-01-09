const { SuccessResponse } = require('../util/APIResponses')
const { ErrorHandler } = require('../middleware/ErrorHandler')
const { IsAuthorised } = require('../middleware/IsAuthorised')
const { UsersLib } = require('../lib/Users')
const { PayloadValidator } = require('../middleware/PayloadValidator')
const yup = require('yup')
const { AuthenticationLib } = require('../lib/Authentication')
const { ServerValidationError } = require('../util/ServerErrors')
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

router.post(
    '/change_password',
    IsAuthorised,
    PayloadValidator(
        yup
            .object()
            .shape({
                old_password: yup
                    .string()
                    .max(255, 'Old Password must be 255 characters or less')
                    .required('Old Password is required'),
                new_password: yup
                    .string()
                    .max(255, 'New Password must be 255 characters or less')
                    .required('New Password is required'),
            })
            .noUnknown(true, 'Unknown options')
            .strict(true),
    ),
    ErrorHandler(async (req, res) => {
        const { new_password, old_password } = req.payload.body

        const users = new UsersLib()
        const user = await users.getActiveUserById(req.user.id)
        const authentication = new AuthenticationLib()

        try {
            await authentication.authenticateUser(
                user.email_address,
                old_password,
            )
        } catch (ex) {
            throw new ServerValidationError(
                'Invalid Old Password',
                'Your password is incorrect',
            )
        }

        const oldHashedPassword = await users.getPassword(req.user.id)

        if (authentication.validatePassword(new_password, oldHashedPassword)) {
            throw new ServerValidationError(
                'New Password is not different from Old Password',
                'Your New Password must be different from your old password',
            )
        }

        // Hash the new Password
        const hashedPassword = authentication.hashPassword(new_password)

        await users.setPassword(req.user.id, hashedPassword)

        const response = new SuccessResponse()
        response.send(res)
    }),
)

module.exports = {
    UserRoutes: router,
}
