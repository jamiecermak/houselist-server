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

class ServerNotFoundError extends ServerError {
    constructor(itemType = 'resource') {
        const capitalisedItemType = `${itemType
            .slice(0, 1)
            .toUpperCase()}${itemType.slice(1, itemType.length).toLowerCase()}`

        super(
            404,
            `${capitalisedItemType} not found`,
            `The requested ${itemType.toLowerCase()} does not exist.`,
        )
    }
}

class ServerPermissionsError extends ServerError {
    constructor(details = null) {
        const extraMessage = details ? ` (${details})` : ''

        super(
            403,
            `Invalid Permissions${extraMessage}`,
            `You do not have permission to perform this action.`,
        )
    }
}

class ServerAuthError extends ServerError {
    constructor(details) {
        super(401, `Unauthorised (${details})`, `Unauthorised request`)
    }
}

class ServerGeneralError extends ServerError {
    constructor(systemMessage, humanMessage, data = null) {
        super(500, systemMessage, humanMessage, data)
    }
}

module.exports = {
    ServerError,
    ServerValidationError,
    ServerNotFoundError,
    ServerPermissionsError,
    ServerAuthError,
    ServerGeneralError,
}
