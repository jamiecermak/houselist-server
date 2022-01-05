const sinon = require('sinon')
const { AuthorisationLib } = require('../../lib/Authorisation')
const { IsAuthorised } = require('../../middleware/IsAuthorised')
const { ServerAuthError } = require('../../util/ServerErrors')

describe('IsAuthorised Middleware', () => {
    let req
    let next
    let authorisedJWT = sinon.stub(AuthorisationLib.prototype, 'authoriseJWT')

    beforeEach(() => {
        req = {
            get: jest.fn(),
        }

        next = jest.fn()
        authorisedJWT.reset()
    })

    it('will call next with ServerAuthError if no Authorization header provided', () => {
        expect.assertions(2)

        return IsAuthorised(req, {}, next).then(() => {
            expect(req.get).toBeCalledWith('Authorization')
            expect(next.mock.calls[0][0]).toBeInstanceOf(ServerAuthError)
        })
    })

    it('will call next once if error', () => {
        expect.assertions(1)

        req.get.mockReturnValue('auth-token')
        authorisedJWT.rejects(new ServerAuthError())

        return IsAuthorised(req, {}, next).then(() => {
            expect(next).toBeCalledTimes(1)
        })
    })

    it('will call next with ServerAuthError if an invalid token is provided', () => {
        expect.assertions(2)

        req.get.mockReturnValue('auth-token')
        authorisedJWT.rejects(new ServerAuthError())

        return IsAuthorised(req, {}, next).then(() => {
            expect(authorisedJWT.calledWith('auth-token')).toBeTruthy()
            expect(next.mock.calls[0][0]).toBeInstanceOf(ServerAuthError)
        })
    })

    it('will call next with no error if a valid token is provided', () => {
        const userId = 10

        expect.assertions(2)

        req.get.mockReturnValue('auth-token')
        authorisedJWT.resolves(userId)

        return IsAuthorised(req, {}, next).then(() => {
            expect(req.user.id).toEqual(userId)
            expect(next).toBeCalledWith()
        })
    })
})
