const { SuccessResponse } = require('../util/APIResponses')
const { ErrorHandler } = require('../middleware/ErrorHandler')
const { IsAuthorised } = require('../middleware/IsAuthorised')
const { PayloadValidator } = require('../middleware/PayloadValidator')
const yup = require('yup')
const { FirebaseLib } = require('../lib/Firebase')
const router = require('express').Router()

/**
 * POST /device/token
 *
 * Register a new FCM Device Token for Notifications
 */
router.post(
    '/token',
    IsAuthorised,
    PayloadValidator(
        yup
            .object()
            .shape({
                token: yup.string().required('Token is required'),
                deviceId: yup.string().required('Device ID is required'),
                deviceName: yup.string().required('Device Name is required'),
            })
            .noUnknown(true, 'Unknown options')
            .strict(true),
    ),
    ErrorHandler(async (req, res) => {
        const { token, deviceId, deviceName } = req.payload.body

        const firebase = new FirebaseLib()

        await firebase.addFCMTokenToUser(
            req.user.id,
            token,
            deviceId,
            deviceName,
        )

        const response = new SuccessResponse()
        response.send(res)
    }),
)

module.exports = {
    DeviceRoutes: router,
}
