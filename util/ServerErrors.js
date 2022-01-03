class ServerError extends Error {
    statusCode = 500
    humanMessage = ''
    responseData = null

    constructor(statusCode, systemMessage, humanMessage = null, data = null) {
        super(systemMessage)

        this.statusCode = statusCode
        this.humanMessage = humanMessage || systemMessage
        this.responseData = data
    }

    static isInstance(obj) {
        return obj.prototype instanceof ServerError
    }
}

class ServerValidationError extends ServerError {
    constructor(details = null) {
        const extraMessage = details ? ` (${details})` : ''

        super(
            400,
            `Invalid Payload${extraMessage}`,
            `There was an issue processing your request.${extraMessage}`,
        )
    }
}

module.exports = { ServerError, ServerValidationError }
