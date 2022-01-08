const request = require('supertest')
const { app } = require('../../handler')
const { database } = require('../../util/Database')

describe('POST /auth/login', () => {
    beforeAll(async () => {
        await database.migrate.latest()
        await database.seed.run()
    })

    afterAll(async () => {
        await database.migrate.rollback()
    })

    it('returns 200 with a JWT if the request succeeded', () => {
        expect.assertions(2)

        return request(app)
            .post('/auth/login')
            .send({
                username: 'johnsmith@example.com',
                password: 'password',
            })
            .then((res) => {
                expect(res.body).toMatchObject({
                    data: {
                        token: expect.any(String),
                    },
                })
                expect(res.statusCode).toEqual(200)
            })
    })

    it('returns an error if it could not sign in', () => {
        expect.assertions(2)

        return request(app)
            .post('/auth/login')
            .send({
                username: 'johnsmith@example.com',
                password: 'wrong-password',
            })
            .then((res) => {
                expect(res.statusCode).not.toEqual(200)
                expect(res.body).toMatchObject({
                    success: false,
                    message: expect.anything(),
                    data: null,
                })
            })
    })

    it('returns an error if given an invalid payload', () => {
        expect.assertions(2)

        return request(app)
            .post('/auth/login')
            .send({
                username: 'test@example.com',
            })
            .then((res) => {
                expect(res.statusCode).not.toEqual(200)
                expect(res.body).toMatchObject({
                    success: false,
                    message: expect.anything(),
                    data: null,
                })
            })
    })
})
