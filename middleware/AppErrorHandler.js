const { ErrorResponse } = require('../util/APIResponses')

function AppErrorHandler(err, req, res, next) {
    if (req.headersSent) {
        next(err)
        return
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
