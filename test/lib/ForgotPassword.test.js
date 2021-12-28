const { database } = require('./../../util/Database')
const mockDb = require('mock-knex')
const { ForgotPasswordLib } = require('../../lib/ForgotPassword')
const tracker = mockDb.getTracker()

beforeEach(() => {
    mockDb.mock(database)
    tracker.install()
})

afterEach(() => {
    tracker.uninstall()
    mockDb.unmock(database)
})

describe('generateResetTokenForUser', () => {
    it('can generate a password reset token for an active user', () => {
        const emailAddress = 'test@example.com'

        tracker.on('query', (query) => {
            query.response([
                {
                    id: 1,
                    email_address: emailAddress,
                    is_active: 1,
                },
            ])
        })

        const forgotPassword = new ForgotPasswordLib()

        jest.spyOn(forgotPassword, 'generateResetToken').mockImplementation(
            () => 'reset-token',
        )

        jest.spyOn(forgotPassword, 'generateResetExpiry').mockImplementation(
            () => '2011-10-05T14:48:00.000Z',
        )

        const createTokenRecord = jest
            .spyOn(forgotPassword, 'createTokenRecord')
            .mockResolvedValue(true)

        return forgotPassword
            .generateResetTokenForUser(emailAddress)
            .then((response) => {
                expect(response).toEqual({
                    token: 'reset-token',
                    expiry: '2011-10-05T14:48:00.000Z',
                    emailAddress,
                })

                expect(createTokenRecord).toHaveBeenCalledTimes(1)
                expect(createTokenRecord).toHaveBeenCalledWith(
                    1,
                    'reset-token',
                    '2011-10-05T14:48:00.000Z',
                )
            })
    })

    it('will throw an error if it can not create the token record', () => {
        const emailAddress = 'test@example.com'

        tracker.on('query', (query) => {
            query.response([
                {
                    id: 1,
                    email_address: emailAddress,
                    is_active: 1,
                },
            ])
        })

        const forgotPassword = new ForgotPasswordLib()

        jest.spyOn(forgotPassword, 'generateResetToken').mockImplementation(
            () => 'reset-token',
        )

        jest.spyOn(forgotPassword, 'generateResetExpiry').mockImplementation(
            () => '2011-10-05T14:48:00.000Z',
        )

        const createTokenRecord = jest
            .spyOn(forgotPassword, 'createTokenRecord')
            .mockResolvedValue(false)

        return forgotPassword
            .generateResetTokenForUser(emailAddress)
            .catch((ex) => {
                expect(ex.message).toEqual(
                    'Could not create token for User ID 1',
                )
            })
    })

    it('will not generate a password reset token for an invalid user', () => {
        const emailAddress = 'test@example.com'

        tracker.on('query', (query) => {
            query.response([])
        })

        const forgotPassword = new ForgotPasswordLib()

        return forgotPassword
            .generateResetTokenForUser(emailAddress)
            .catch((ex) => {
                expect(ex.message).toEqual(
                    'User with Email Address test@example.com not found',
                )
            })
    })
})

describe('generateResetToken', () => {
    it('can generate a reset token string', () => {
        const forgotPassword = new ForgotPasswordLib()

        const response = forgotPassword.generateResetToken()

        expect(typeof response).toEqual('string')
        expect(response.length).toEqual(36)
    })
})

describe('generateResetExpiry', () => {
    it('can generate a reset token expiry with default params', () => {
        const forgotPassword = new ForgotPasswordLib()

        const response = forgotPassword.generateResetExpiry()

        expect(typeof response).toEqual('string')
        expect(response.length).toEqual(24)
    })

    it('can generate a reset token expiry with overriden params', () => {
        const forgotPassword = new ForgotPasswordLib()

        const def_response = forgotPassword.generateResetExpiry()
        const ovd_response = forgotPassword.generateResetExpiry(24)

        expect(def_response).not.toEqual(ovd_response)
    })
})

describe('createTokenRecord', () => {
    it('can create the token record for a new reset request', () => {
        const userId = 1
        const resetToken = 'reset-token'
        const expiry = 'expiry-date'

        tracker.on('query', (query) => {
            expect(query.method).toEqual('insert')
            query.response()
        })

        const forgotPassword = new ForgotPasswordLib()

        return forgotPassword
            .createTokenRecord(userId, resetToken, expiry)
            .then((response) => {
                expect(response).toEqual(true)
            })
    })

    it('will return false if the creation failed', () => {
        const userId = 1
        const resetToken = 'reset-token'
        const expiry = 'expiry-date'

        tracker.on('query', (query) => {
            query.reject('Error')
        })

        const forgotPassword = new ForgotPasswordLib()

        return forgotPassword
            .createTokenRecord(userId, resetToken, expiry)
            .then((response) => {
                expect(response).toEqual(false)
            })
    })
})

describe('Forgot Password Lib', () => {
    it('can verify a password reset token for a given user', () => {})

    it('will not honour an expired password reset token', () => {})

    it('will reset the password for a valid reset request', () => {})
})
