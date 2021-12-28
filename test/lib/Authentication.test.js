const { database } = require('./../../util/Database')
const mockDb = require('mock-knex')
const tracker = mockDb.getTracker()
const { AuthenticationLib } = require('../../lib/Authentication')

describe('Authentication Lib', () => {
    beforeEach(() => {
        mockDb.mock(database)
        tracker.install()
    })

    afterEach(() => {
        tracker.uninstall()
        mockDb.unmock(database)
    })

    it('can authenticate a email address and password', () => {
        const emailAddress = 'test@example.com'
        const password = 'password'

        tracker.on('query', (query) => {
            query.response([
                {
                    id: 1,
                    email_address: emailAddress,
                    password: 'not-the-same-password',
                },
            ])
        })

        const authentication = new AuthenticationLib()

        const validatePassword = jest
            .spyOn(authentication, 'validatePassword')
            .mockImplementation(() => true)

        return authentication
            .authenticateUser(emailAddress, password)
            .then((userId) => {
                expect(userId).toEqual(1)
                expect(validatePassword).toHaveBeenCalledTimes(1)
                expect(validatePassword).toHaveBeenCalledWith(
                    password,
                    'not-the-same-password',
                )
            })
    })

    it('will not authenticate a valid user with an invalid password', () => {
        const emailAddress = 'test@example.com'
        const password = 'invalid-password'

        tracker.on('query', (query) => {
            query.response([
                {
                    id: 1,
                    email_address: emailAddress,
                    password: 'password',
                },
            ])
        })

        const authentication = new AuthenticationLib()

        const validatePassword = jest
            .spyOn(authentication, 'validatePassword')
            .mockImplementation(() => false)

        return authentication
            .authenticateUser(emailAddress, password)
            .catch((ex) => {
                expect(ex.message).toEqual('Invalid Password for User ID 1')
                expect(validatePassword).toHaveBeenCalledTimes(1)
                expect(validatePassword).toHaveBeenCalledWith(
                    password,
                    'password',
                )
            })
    })

    it('will not authenticate a non existing user', () => {
        const emailAddress = 'test@example.com'
        const password = 'password'

        tracker.on('query', (query) => {
            query.response([])
        })

        const authentication = new AuthenticationLib()

        const validatePassword = jest
            .spyOn(authentication, 'validatePassword')
            .mockImplementation(() => false)

        return authentication
            .authenticateUser(emailAddress, password)
            .catch((ex) => {
                expect(ex.message).toEqual(
                    'User with Email Address test@example.com not found',
                )
                expect(validatePassword).toHaveBeenCalledTimes(0)
            })
    })

    it('will generate a hash for a password', () => {
        const authentication = new AuthenticationLib()
        const password = 'password-to-hash'

        const result = authentication.hashPassword(password)

        expect(typeof result).toBe('string')
        expect(result).not.toEqual(password)
    })

    it.todo('can signup')

    it.todo('can generate a forgotten password token')

    it.todo('can set a new password for a forgotten account')
})
