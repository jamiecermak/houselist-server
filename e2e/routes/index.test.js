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

describe('Unknown Paths', () => {
    it('will return an error response for an invalid path', () => {
        expect.assertions(2)

        return request(app)
            .get('/invalid-path')
            .then((res) => {
                expect(res.statusCode).toEqual(404)
                expect(res.body).toMatchObject({
                    message: 'The requested path does not exist.',
                    success: false,
                })
            })
    })
})
