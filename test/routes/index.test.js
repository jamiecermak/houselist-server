const request = require('supertest')
const { app } = require('../../handler')

describe('GET /', () => {
    it('returns 200', () => {
        expect.assertions(1)

        return request(app)
            .get('/')
            .then((res) => {
                expect(res.statusCode).toEqual(200)
            })
    })
})
