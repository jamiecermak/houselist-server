const { ErrorResponse } = require('../util/APIResponses')

/**
 * Express Error Handler
 *
 * @param {*} err
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 */
function AppErrorHandler(err, req, res, next) {
    if (req.headersSent) {
        return next(err)
    }

    const { data, statusCode, success, message } =
        ErrorResponse.fromException(err)

    res.status(statusCode)
    res.json({
        success,
        message,
        data,
    })
}

module.exports = {
    AppErrorHandler,
}
