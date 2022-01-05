const request = require('supertest')
const { app } = require('../../handler')
const { AuthenticationLib } = require('../../lib/Authentication')
const sinon = require('sinon')
const { ServerAuthError } = require('../../util/ServerErrors')

describe('POST /auth/login', () => {
    const authenticateUser = sinon.stub(
        AuthenticationLib.prototype,
        'authenticateUser',
    )

    beforeEach(() => {
        authenticateUser.reset()
    })

    afterAll(() => {
        authenticateUser.restore()
    })

    it('returns 200 with a JWT if the request succeeded', () => {
        expect.assertions(3)

        authenticateUser.resolves('some-token')

        return request(app)
            .post('/auth/login')
            .send({
                username: 'test@example.com',
                password: 'password',
            })
            .then((res) => {
                expect(
                    authenticateUser.calledWith('test@example.com', 'password'),
                ).toBeTruthy()

                expect(res.body).toMatchObject({
                    data: {
                        token: 'some-token',
                    },
                })
                expect(res.statusCode).toEqual(200)
            })
    })

    it('returns an error if it could not sign in', () => {
        expect.assertions(3)

        authenticateUser.rejects(new ServerAuthError())

        return request(app)
            .post('/auth/login')
            .send({
                username: 'test@example.com',
                password: 'password',
            })
            .then((res) => {
                expect(authenticateUser.calledOnce).toBeTruthy()
                expect(res.statusCode).not.toEqual(200)
                expect(res.body).toMatchObject({
                    success: false,
                    message: expect.anything(),
                    data: null,
                })
            })
    })

    it('returns an error if given an invalid payload', () => {
        expect.assertions(3)

        authenticateUser.rejects(new ServerAuthError())

        return request(app)
            .post('/auth/login')
            .send({
                username: 'test@example.com',
            })
            .then((res) => {
                expect(authenticateUser.notCalled).toBeTruthy()
                expect(res.statusCode).not.toEqual(200)
                expect(res.body).toMatchObject({
                    success: false,
                    message: expect.anything(),
                    data: null,
                })
            })
    })
})
