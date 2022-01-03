const {
    ServerError,
    ServerValidationError,
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

describe('ServerNotFoundError', () => {})

describe('ServerPermissionsError', () => {})

describe('ServerAuthError', () => {})

describe('ServerGeneralError', () => {})
