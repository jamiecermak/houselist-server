const request = require('supertest')
const { app } = require('../../handler')
const { IsAuthorised } = require('../../middleware/IsAuthorised')
const { database } = require('../../util/Database')

jest.mock('../../middleware/IsAuthorised')

describe('GET /user', () => {
    beforeEach(async () => {
        await database.migrate.latest()
        await database.seed.run()
    })

    afterEach(async () => {
        await database.migrate.rollback()
    })

    it('call authorisation middleware', () => {
        expect.assertions(1)

        return request(app)
            .get('/user')
            .then(() => {
                expect(IsAuthorised).toBeCalled()
            })
    })

    it('returns 200 with a user information', () => {
        expect.assertions(2)

        return request(app)
            .get('/user')
            .then((res) => {
                expect(res.body).toEqual({
                    success: true,
                    data: {
                        id: 1,
                        name: 'John Smith',
                        username: 'johnsmith',
                        email_address: 'johnsmith@example.com',
                    },
                    message: null,
                })
                expect(res.statusCode).toEqual(200)
            })
    })
})

describe('POST /user/change_password', () => {
    beforeEach(async () => {
        await database.migrate.latest()
        await database.seed.run()
    })

    afterEach(async () => {
        await database.migrate.rollback()
    })

    it('call authorisation middleware', () => {
        expect.assertions(1)

        return request(app)
            .post('/user/change_password')
            .then(() => {
                expect(IsAuthorised).toBeCalled()
            })
    })

    it('returns 200 when given a valid same old password and new password', () => {
        expect.assertions(3)

        return request(app)
            .post('/user/change_password')
            .send({
                new_password: 'new-password',
                old_password: 'password',
            })
            .then((res) => {
                expect(res.body).toEqual({
                    success: true,
                    data: null,
                    message: null,
                })
                expect(res.statusCode).toEqual(200)

                return request(app)
                    .post('/auth/login')
                    .send({
                        username: 'johnsmith@example.com',
                        password: 'new-password',
                    })
                    .then((res) => {
                        expect(res.statusCode).toEqual(200)
                    })
            })
    })

    it('fails if old password is wrong', () => {
        expect.assertions(2)

        return request(app)
            .post('/user/change_password')
            .send({
                new_password: 'new-password',
                old_password: 'wrong-password',
            })
            .then((res) => {
                expect(res.body).toEqual({
                    success: false,
                    message:
                        'There was an issue processing your request. (Your password is incorrect)',
                    data: null,
                })
                expect(res.statusCode).not.toEqual(200)
            })
    })

    it('fails if wrong payload', () => {
        expect.assertions(2)

        return request(app)
            .post('/user/change_password')
            .send({
                new_password: 'new-password',
            })
            .then((res) => {
                expect(res.body).toEqual({
                    success: false,
                    message: 'There was an issue processing your request.',
                    data: null,
                })
                expect(res.statusCode).not.toEqual(200)
            })
    })
})
