const {
    ServerError,
    ServerValidationError,
    ServerNotFoundError,
    ServerPermissionsError,
    ServerAuthError,
    ServerGeneralError,
    ServerDatabaseError,
} = require('../../util/ServerErrors')

describe('ServerError', () => {
    it('can identify an instance of itself', () => {
        expect(ServerError.isInstance(ServerValidationError)).toEqual(true)
        expect(ServerError.isInstance(String)).toEqual(false)
        expect(ServerError.isInstance(Error)).toEqual(false)
    })
})

describe('ServerValidationError', () => {
    it('will display an invalid payload message', () => {
        const errorInstance = new ServerValidationError()

        expect(errorInstance.statusCode).toEqual(400)
        expect(errorInstance.message).toEqual('Invalid Request')
        expect(errorInstance.humanMessage).toEqual(
            'There was an issue processing your request.',
        )
    })

    it('will allow an overridden system message', () => {
        const errorInstance = new ServerValidationError('system message')

        expect(errorInstance.statusCode).toEqual(400)
        expect(errorInstance.message).toEqual(
            'Invalid Request (system message)',
        )
        expect(errorInstance.humanMessage).toEqual(
            'There was an issue processing your request.',
        )
    })

    it('will allow an overridden system and human message', () => {
        const errorInstance = new ServerValidationError(
            'system message',
            'human message',
        )

        expect(errorInstance.statusCode).toEqual(400)
        expect(errorInstance.message).toEqual(
            'Invalid Request (system message)',
        )
        expect(errorInstance.humanMessage).toEqual(
            'There was an issue processing your request. (human message)',
        )
    })
})

describe('ServerNotFoundError', () => {
    it('will display a resouce not found message', () => {
        const errorInstance = new ServerNotFoundError()

        expect(errorInstance.statusCode).toEqual(404)
        expect(errorInstance.message).toEqual('Resource not found')
        expect(errorInstance.humanMessage).toEqual(
            'The requested resource does not exist.',
        )
    })

    it('will allow an overridden item type', () => {
        const errorInstance = new ServerNotFoundError('list item')

        expect(errorInstance.statusCode).toEqual(404)
        expect(errorInstance.message).toEqual('List item not found')
        expect(errorInstance.humanMessage).toEqual(
            'The requested list item does not exist.',
        )
    })
})

describe('ServerPermissionsError', () => {
    it('will display an invalid payload message', () => {
        const errorInstance = new ServerPermissionsError()

        expect(errorInstance.statusCode).toEqual(403)
        expect(errorInstance.message).toEqual('Invalid Permissions')
        expect(errorInstance.humanMessage).toEqual(
            'You do not have permission to perform this action.',
        )
    })

    it('will allow an overridden message', () => {
        const errorInstance = new ServerPermissionsError('no permission')

        expect(errorInstance.statusCode).toEqual(403)
        expect(errorInstance.message).toEqual(
            'Invalid Permissions (no permission)',
        )
        expect(errorInstance.humanMessage).toEqual(
            'You do not have permission to perform this action.',
        )
    })
})

describe('ServerAuthError', () => {
    it('will display an unauthorised payload message', () => {
        const errorInstance = new ServerAuthError('test message')

        expect(errorInstance.statusCode).toEqual(401)
        expect(errorInstance.message).toEqual('Unauthorised (test message)')
        expect(errorInstance.humanMessage).toEqual('Unauthorised request')
    })
})

describe('ServerGeneralError', () => {
    it('will display an error message', () => {
        const errorInstance = new ServerGeneralError(
            'system message',
            'human message',
        )

        expect(errorInstance.statusCode).toEqual(500)
        expect(errorInstance.message).toEqual('system message')
        expect(errorInstance.humanMessage).toEqual('human message')
        expect(errorInstance.responseData).toEqual(null)
    })

    it('will hold data', () => {
        const errorInstance = new ServerGeneralError(
            'system message',
            'human message',
            [1, 2, 3],
        )

        expect(errorInstance.responseData).toEqual([1, 2, 3])
    })
})

describe('ServerDatabaseError', () => {
    it('will display an error message', () => {
        const dbErrorInstance = new Error('system message')
        const errorInstance = new ServerDatabaseError(dbErrorInstance)

        expect(errorInstance.statusCode).toEqual(500)
        expect(errorInstance.message).toEqual('Database Error (system message)')
        expect(errorInstance.humanMessage).toEqual(
            'An unexpected error occurred. Please try again.',
        )
        expect(errorInstance.responseData).toEqual(null)
        expect(errorInstance.stack).toBe(dbErrorInstance.stack)
    })
})
