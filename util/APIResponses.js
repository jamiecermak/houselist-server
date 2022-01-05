const { ServerError } = require('./ServerErrors')

class APIResponse {
    data = null
    success = true
    statusCode = 200
    message = null

    constructor(statusCode, success, data, message) {
        this.statusCode = statusCode
        this.success = success
        this.data = data
        this.message = message
    }

    asObject() {
        return {
            success: this.success,
            data: this.data,
            message: this.message,
        }
    }

    send(res) {
        res.status(this.statusCode)
        res.json(this.asObject())
    }
}

class SuccessResponse extends APIResponse {
    constructor(data = null, { statusCode = 200, message = null } = {}) {
        super(statusCode, true, data, message)
    }
}

class ErrorResponse extends APIResponse {
    constructor(message, { statusCode = 500, data = null } = {}) {
        super(statusCode, false, data, message)
    }

    static fromException(exception) {
        if (
            exception.prototype instanceof ServerError ||
            exception instanceof ServerError
        ) {
            return new ErrorResponse(exception.humanMessage, {
                statusCode: exception.statusCode,
                data: exception.responseData,
            })
        }

        return new ErrorResponse(
            'An unknown internal error occurred. Please try again later.',
            {
                statusCode: 500,
                data: exception.responseData,
            },
        )
    }
}

module.exports = {
    SuccessResponse,
    ErrorResponse,
}
