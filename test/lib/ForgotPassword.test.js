const { database } = require('../../util/Database')
const mockDb = require('mock-knex')
const sinon = require('sinon')
const { UsersLib } = require('../../lib/Users')
const { ForgotPasswordLib } = require('../../lib/ForgotPassword')
const { sub, add } = require('date-fns')
const {
    ServerGeneralError,
    ServerValidationError,
} = require('../../util/ServerErrors')
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

        jest.spyOn(forgotPassword, 'createTokenRecord').mockResolvedValue(false)

        return forgotPassword
            .generateResetTokenForUser(emailAddress)
            .catch((ex) => {
                expect(ex).toBeInstanceOf(ServerGeneralError)
                expect(ex.message).toContain(
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
                expect(ex).toBeInstanceOf(ServerValidationError)
                expect(ex.message).toContain(
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
        expect(response).toEqual('test-uuid')
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

describe('verifyResetToken', () => {
    it('can verify a password reset token for a given user', () => {
        const emailAddress = 'test@example.com'
        const resetToken = 'reset-token'
        const userId = 1
        const expiryDate = add(new Date(), { days: 1 }).toISOString()

        tracker.on('query', (query) => {
            query.response([
                {
                    id: 2,
                    User_id: userId,
                    reset_token: resetToken,
                    expiry_date: expiryDate,
                },
            ])
        })

        const forgotPassword = new ForgotPasswordLib()

        return forgotPassword
            .verifyResetToken(emailAddress, resetToken)
            .then((response) => {
                expect(response).toEqual({
                    id: 2,
                    User_id: userId,
                })
            })
    })

    it('will not honour an invalid reset token', () => {
        expect.assertions(3)

        const emailAddress = 'test@example.com'
        const resetToken = 'reset-token'

        tracker.on('query', (query) => {
            query.response([])
        })

        const forgotPassword = new ForgotPasswordLib()

        return forgotPassword
            .verifyResetToken(emailAddress, resetToken)
            .catch((ex) => {
                expect(ex).toBeInstanceOf(ServerValidationError)
                expect(ex.message).toContain('Invalid Reset Token')
                expect(ex.humanMessage).toContain('Invalid Reset Token')
            })
    })

    it('will not honour an expired password reset token', () => {
        expect.assertions(3)

        const emailAddress = 'test@example.com'
        const resetToken = 'reset-token'
        const userId = 1
        const expiryDate = sub(new Date(), { days: 1 }).toISOString()

        tracker.on('query', (query) => {
            query.response([
                {
                    id: 2,
                    User_id: userId,
                    reset_token: resetToken,
                    expiry_date: expiryDate,
                },
            ])
        })

        const forgotPassword = new ForgotPasswordLib()

        return forgotPassword
            .verifyResetToken(emailAddress, resetToken)
            .catch((ex) => {
                expect(ex).toBeInstanceOf(ServerValidationError)
                expect(ex.message).toContain('Expired Token')
                expect(ex.humanMessage).toContain('Invalid Reset Token')
            })
    })
})

describe('resetPasswordWithToken', () => {
    it('will reset a valid password', () => {
        const userId = 2
        const emailAddress = 'test@example.com'
        const resetToken = 'reset-token'
        const newPassword = 'new-password'

        const setPassword = sinon
            .stub(UsersLib.prototype, 'setPassword')
            .callsFake(async () => {})

        const forgotPassword = new ForgotPasswordLib()

        jest.spyOn(forgotPassword, 'verifyResetToken').mockResolvedValue({
            id: 1,
            User_id: userId,
        })

        jest.spyOn(forgotPassword, 'useResetToken').mockResolvedValue()

        return forgotPassword
            .resetPasswordWithToken(emailAddress, resetToken, newPassword)
            .catch(() => {
                throw new Error('Test Failed')
            })
            .then(() => {
                expect(setPassword.args).toEqual([[userId, newPassword]])

                setPassword.restore()
            })
    })

    it('will not reset an invalid password', () => {
        expect.assertions(1)

        const newPassword = 'new-password'
        const emailAddress = 'test@example.com'
        const resetToken = 'reset-token'
        const forgotPassword = new ForgotPasswordLib()

        jest.spyOn(forgotPassword, 'verifyResetToken').mockImplementation(
            () => {
                throw new Error('test')
            },
        )

        return forgotPassword
            .resetPasswordWithToken(emailAddress, resetToken, newPassword)
            .catch((ex) => {
                expect(ex.message).toEqual('test')
            })
    })
})

describe('useResetToken', () => {
    it('will set the is_used, used_at and used_by property on a reset token', () => {
        expect.assertions(3)

        const resetToken = 'reset-token'

        tracker.on('query', (query) => {
            expect(query.method).toEqual('update')
            expect(query.bindings[0]).toEqual(1)
            expect(query.bindings[2]).toEqual(resetToken)
            query.response()
        })

        const forgotPassword = new ForgotPasswordLib()

        return forgotPassword.useResetToken(resetToken)
    })
})
