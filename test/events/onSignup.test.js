const sinon = require('sinon')
const { onSignup } = require('../../events/onSignup')
const { UsersLib } = require('../../lib/Users')

jest.mock('../../lib/EmailService/EmailSender')
const {
    EmailSenderLib,
    mockSend,
} = require('../../lib/EmailService/EmailSender')

describe('onSignup', () => {
    const userId = 10

    const getActiveUserById = sinon.stub(
        UsersLib.prototype,
        'getActiveUserById',
    )

    afterEach(() => {
        getActiveUserById.reset()
        EmailSenderLib.mockClear()
        mockSend.mockClear()
    })

    it('sends out an email for the new user', () => {
        getActiveUserById.resolves({
            name: 'John Smith',
            email_address: 'johnsmith@example.com',
        })

        return onSignup(userId).then(() => {
            expect(getActiveUserById.calledWith(userId)).toEqual(true)
            expect(EmailSenderLib).toHaveBeenCalledWith(
                'signup',
                'Welcome to Houselist!',
            )
            expect(mockSend).toHaveBeenCalledWith(
                'John Smith',
                'johnsmith@example.com',
            )
        })
    })
})
