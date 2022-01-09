const { SuccessResponse } = require('../util/APIResponses')
const { ErrorHandler } = require('../middleware/ErrorHandler')
const { IsAuthorised } = require('../middleware/IsAuthorised')
const { PayloadValidator } = require('../middleware/PayloadValidator')
const yup = require('yup')
const { FirebaseLib } = require('../lib/Firebase')
const router = require('express').Router()

router.post(
    '/token',
    IsAuthorised,
    PayloadValidator(
        yup
            .object()
            .shape({
                token: yup.string().required('Token is required'),
            })
            .noUnknown(true, 'Unknown options')
            .strict(true),
    ),
    ErrorHandler(async (req, res) => {
        const { token } = req.payload.body

        const firebase = new FirebaseLib()

        await firebase.addFCMTokenToUser(req.user.id, token)

        const response = new SuccessResponse()
        response.send(res)
    }),
)

module.exports = {
    DeviceRoutes: router,
}
