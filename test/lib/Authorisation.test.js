const { database } = require('../../util/Database')
const mockDb = require('mock-knex')
const tracker = mockDb.getTracker()
const { AuthorisationLib } = require('../../lib/Authorisation')
const jwt = require('jsonwebtoken')
const { ServerAuthError } = require('../../util/ServerErrors')
const Secrets = require('../../util/__mocks__/Secrets')

jest.mock('../../util/Secrets')

beforeEach(() => {
    mockDb.mock(database)
    tracker.install()
})

afterEach(() => {
    tracker.uninstall()
    mockDb.unmock(database)
})

describe('generateJWT', () => {
    it('can generate a jwt for a key, userid and expiry', () => {
        const userId = 1

        const authorisation = new AuthorisationLib()

        const response = authorisation.generateJWT(userId)

        expect(typeof response).toEqual('string')

        const jwtResponse = jwt.verify(response, Secrets.HL_JWT_SECRET)

        expect(jwtResponse.userId).toEqual(userId)
    })
})

describe('validateJWT', () => {
    it('can validate a valid jwt', () => {
        const userId = 20
        const encodedJwt = jwt.sign({ userId }, Secrets.HL_JWT_SECRET, {
            expiresIn: '1d',
        })

        const authorisation = new AuthorisationLib()

        const response = authorisation.validateJWT(encodedJwt)

        expect(response).toEqual(userId)
    })

    it('will throw on passing an invalid jwt', () => {
        expect.assertions(2)
        const invalidJWT = 'this-is-not-a-jwt'

        const authorisation = new AuthorisationLib()

        try {
            authorisation.validateJWT(invalidJWT)
        } catch (ex) {
            expect(ex).toBeInstanceOf(jwt.JsonWebTokenError)
            expect(ex.message).toEqual('jwt malformed')
        }
    })

    it('will throw on passing a jwt signed with the wrong key', () => {
        expect.assertions(2)
        const userId = 20
        const invalidJWT = jwt.sign({ userId }, 'the-incorrect-secret', {
            expiresIn: '1d',
        })

        const authorisation = new AuthorisationLib()

        try {
            authorisation.validateJWT(invalidJWT)
        } catch (ex) {
            expect(ex).toBeInstanceOf(jwt.JsonWebTokenError)
            expect(ex.message).toEqual('invalid signature')
        }
    })

    it('will not validate an expired jwt', () => {
        expect.assertions(1)
        const userId = 20
        const invalidJWT = jwt.sign({ userId }, Secrets.HL_JWT_SECRET, {
            expiresIn: -100000,
        })

        const authorisation = new AuthorisationLib()

        try {
            authorisation.validateJWT(invalidJWT, Secrets.HL_JWT_SECRET)
        } catch (ex) {
            expect(ex).toBeInstanceOf(jwt.TokenExpiredError)
        }
    })
})

describe('authoriseJWT', () => {
    it('can authorise a valid jwt and return the user id', () => {
        const userId = 20
        const encodedJwt = 'a-valid-jwt'

        const authorisation = new AuthorisationLib()

        const validateJwt = jest
            .spyOn(authorisation, 'validateJWT')
            .mockReturnValue(userId)

        tracker.on('query', (query) => {
            query.response([
                {
                    id: userId,
                    is_active: 1,
                },
            ])
        })

        return authorisation.authoriseJWT(encodedJwt).then((response) => {
            expect(response).toEqual(userId)
            expect(validateJwt).toHaveBeenCalledTimes(1)
            expect(validateJwt.mock.calls[0][0]).toEqual(encodedJwt)
        })
    })

    it('will not authorise a non-existent or inactive user', () => {
        const userId = 20
        const encodedJwt = 'a-valid-jwt'

        const authorisation = new AuthorisationLib()

        jest.spyOn(authorisation, 'validateJWT').mockReturnValue(userId)

        tracker.on('query', (query) => {
            query.response([])
        })

        return authorisation.authoriseJWT(encodedJwt).catch((ex) => {
            expect(ex).toBeInstanceOf(ServerAuthError)
            expect(ex.message).toContain('Invalid or inactive user')
        })
    })

    it('will not authorise an invalid jwt', () => {
        const encodedJwt = 'a-valid-jwt'

        const authorisation = new AuthorisationLib()

        jest.spyOn(authorisation, 'validateJWT').mockImplementation(() => {
            throw new Error('any jwt error')
        })

        return authorisation.authoriseJWT(encodedJwt).catch((ex) => {
            expect(ex).toBeInstanceOf(ServerAuthError)
            expect(ex.message).toContain('Failed to verify authorisation token')
        })
    })
})
