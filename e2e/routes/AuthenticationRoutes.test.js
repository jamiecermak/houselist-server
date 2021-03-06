const request = require('supertest')
const { app } = require('../../handler')
const { UsersLib } = require('../../lib/Users')
const { database } = require('../../util/Database')

jest.mock('../../events/onSignup')
const { onSignup } = require('../../events/onSignup')

describe('POST /auth/login', () => {
    beforeEach(async () => {
        await database.migrate.latest()
        await database.seed.run()
    })

    afterEach(async () => {
        await database.migrate.rollback()
    })

    it('returns 200 with a JWT if the request succeeded', () => {
        expect.assertions(2)

        return request(app)
            .post('/auth/login')
            .send({
                email_address: 'johnsmith@example.com',
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
                email_address: 'johnsmith@example.com',
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
                email_address: 'test@example.com',
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

describe('POST /auth/signup', () => {
    beforeEach(async () => {
        await database.migrate.latest()
        await database.seed.run()
    })

    afterEach(async () => {
        await database.migrate.rollback()
        onSignup.mockClear()
    })

    it('returns 200 if the request succeeded', () => {
        expect.assertions(1)

        return request(app)
            .post('/auth/signup')
            .send({
                name: 'Garry Peters',
                username: 'garrypeters',
                email_address: 'garry@example.com',
                password: 'some-password',
            })
            .then((res) => {
                expect(res.statusCode).toEqual(200)
            })
    })

    it('fires the onSignup event', () => {
        expect.assertions(1)

        return request(app)
            .post('/auth/signup')
            .send({
                name: 'Garry Peters',
                username: 'garrypeters',
                email_address: 'garry@example.com',
                password: 'some-password',
            })
            .then((res) => {
                expect(onSignup).toHaveBeenCalledWith(4)
            })
    })

    it('creates a user and can sign in', () => {
        expect.assertions(2)

        return request(app)
            .post('/auth/signup')
            .send({
                name: 'Garry Peters',
                username: 'garrypeters',
                email_address: 'garry@example.com',
                password: 'some-password',
            })
            .then(() => {
                const users = new UsersLib()

                return users.getActiveUserById(4)
            })
            .then((user) => {
                expect(user).toMatchObject({
                    id: 4,
                    name: 'Garry Peters',
                    email_address: 'garry@example.com',
                    username: 'garrypeters',
                })

                return request(app).post('/auth/login').send({
                    email_address: 'garry@example.com',
                    password: 'some-password',
                })
            })
            .then((res) => {
                expect(res.statusCode).toEqual(200)
            })
    })

    it('returns an error if given an invalid payload', () => {
        expect.assertions(2)

        return request(app)
            .post('/auth/signup')
            .send({
                username: 'test@example.com',
            })
            .then((res) => {
                expect(res.statusCode).toEqual(400)
                expect(res.body).toMatchObject({
                    success: false,
                    message: expect.stringContaining('There was an issue'),
                    data: null,
                })
            })
    })
})
