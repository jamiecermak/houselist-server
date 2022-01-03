const request = require('supertest')
const { app } = require('../../handler')

describe('POST /auth/login', () => {
    it('returns 200 with a JWT if the request succeeded', () => {
        expect.assertions(1)

        return request(app)
            .get('/auth/login')
            .then((res) => {
                expect(res.statusCode).toEqual(200)
                expect(JSON.parse(res.body))
            })
    })
})
