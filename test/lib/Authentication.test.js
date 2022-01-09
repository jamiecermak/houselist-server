const { database } = require('../../util/Database')
const mockDb = require('mock-knex')
const tracker = mockDb.getTracker()
const { AuthenticationLib } = require('../../lib/Authentication')
const { ServerValidationError } = require('../../util/ServerErrors')
const sinon = require('sinon')
const { UsersLib } = require('../../lib/Users')

beforeEach(() => {
    mockDb.mock(database)
    tracker.install()
})

afterEach(() => {
    tracker.uninstall()
    mockDb.unmock(database)
})

describe('authenticateUser', () => {
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
                expect(ex instanceof ServerValidationError).toEqual(true)
                expect(ex.message).toContain('Invalid Password for User ID 1')
                expect(ex.humanMessage).toContain(
                    'Incorrect Email Address or Password',
                )
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
                expect(ex).toBeInstanceOf(ServerValidationError)
                expect(ex.message).toContain(
                    'User with Email Address test@example.com not found',
                )
                expect(ex.humanMessage).toContain(
                    'Incorrect Email Address or Password',
                )
                expect(validatePassword).toHaveBeenCalledTimes(0)
            })
    })
})

describe('hashPassword', () => {
    it('will generate a hash for a password', () => {
        const authentication = new AuthenticationLib()
        const password = 'password-to-hash'

        const result = authentication.hashPassword(password)

        expect(typeof result).toBe('string')
        expect(result).not.toEqual(password)
    })
})

describe('signup', () => {
    it('will call createUser', () => {
        expect.assertions(4)

        const authentication = new AuthenticationLib()

        const hashPassword = jest
            .spyOn(authentication, 'hashPassword')
            .mockReturnValue('hashed-password')

        const createUser = sinon
            .stub(UsersLib.prototype, 'createUser')
            .resolves(1)

        return authentication
            .signup(
                'John Smith',
                'johnsmith',
                'johnsmith@example.com',
                'password',
            )
            .then((result) => {
                expect(hashPassword).toBeCalledWith('password')
                expect(
                    createUser.calledWith(
                        'John Smith',
                        'johnsmith',
                        'johnsmith@example.com',
                        'hashed-password',
                    ),
                ).toBeTruthy()
                expect(typeof result).toEqual('number')
                expect(result).toEqual(1)
            })
            .finally(() => {
                createUser.restore()
            })
    })
})
