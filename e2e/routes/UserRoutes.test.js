const request = require('supertest')
const { app } = require('../../handler')
const { IsAuthorised } = require('../../middleware/IsAuthorised')
const { database } = require('../../util/Database')

jest.mock('../../middleware/IsAuthorised')

describe('GET /user', () => {
    beforeAll(async () => {
        await database.migrate.latest()
        await database.seed.run()
    })

    afterAll(async () => {
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
