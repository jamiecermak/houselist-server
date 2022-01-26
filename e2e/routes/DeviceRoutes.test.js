const request = require('supertest')
const { app } = require('../../handler')
const { FirebaseLib } = require('../../lib/Firebase')
const { IsAuthorised } = require('../../middleware/IsAuthorised')
const { database } = require('../../util/Database')

jest.mock('../../middleware/IsAuthorised')

describe('POST /device/token', () => {
    beforeEach(async () => {
        await database.migrate.latest()
        await database.seed.run()
    })

    afterEach(async () => {
        await database.migrate.rollback()
    })

    it('will call IsAuthorised', () => {
        expect.assertions(1)

        return request(app)
            .post('/device/token')
            .send({ token: 'test-token' })
            .then(() => {
                expect(IsAuthorised).toBeCalled()
            })
    })

    it('will add a firebase device token to a user and return 200', () => {
        expect.assertions(4)

        return request(app)
            .post('/device/token')
            .send({
                token: 'test-token',
                deviceId: 'device-id',
                deviceName: 'device-name',
            })
            .then((res) => {
                expect(res.statusCode).toEqual(200)
                expect(res.body).toMatchObject({
                    success: true,
                    data: null,
                    message: null,
                })

                const firebase = new FirebaseLib()

                return firebase.getAllFCMTokensForUsers([1])
            })
            .then((tokens) => {
                expect(tokens.length).toEqual(1)
                expect(tokens[0]).toEqual('test-token')
            })
    })

    it('will fail with wrong payload', () => {
        expect.assertions(2)

        return request(app)
            .post('/device/token')
            .send({ test: 'test' })
            .then((res) => {
                expect(res.statusCode).toEqual(400)
                expect(res.body).toMatchObject({
                    success: false,
                    message: 'There was an issue processing your request.',
                })
            })
    })

    it('will not add multiple tokens if they are the same', () => {
        expect.assertions(2)

        return request(app)
            .post('/device/token')
            .send({
                token: 'test-token',
                deviceId: 'device-id',
                deviceName: 'device-name',
            })
            .then(() => {
                return request(app)
                    .post('/device/token')
                    .send({
                        token: 'test-token',
                        deviceId: 'device-id',
                        deviceName: 'device-name',
                    })
            })
            .then(() => {
                const firebase = new FirebaseLib()

                return firebase.getAllFCMTokensForUsers([1])
            })
            .then((tokens) => {
                expect(tokens.length).toEqual(1)
                expect(tokens[0]).toEqual('test-token')
            })
    })
})
