const {
    ServerError,
    ServerValidationError,
    ServerNotFoundError,
    ServerPermissionsError,
    ServerAuthError,
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
        expect(errorInstance.message).toEqual('Invalid Payload')
        expect(errorInstance.humanMessage).toEqual(
            'There was an issue processing your request.',
        )
    })

    it('will allow an overridden message', () => {
        const errorInstance = new ServerValidationError('incorrect options')

        expect(errorInstance.statusCode).toEqual(400)
        expect(errorInstance.message).toEqual(
            'Invalid Payload (incorrect options)',
        )
        expect(errorInstance.humanMessage).toEqual(
            'There was an issue processing your request. (incorrect options)',
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

describe('ServerGeneralError', () => {})
