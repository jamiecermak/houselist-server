const request = require('supertest')
const { app } = require('../../../handler')
const { ListsLib } = require('../../../lib/Lists')
const { IsAuthorised } = require('../../../middleware/IsAuthorised')
const { database } = require('../../../util/Database')

jest.mock('../../../middleware/IsAuthorised')

describe('POST /list', () => {
    beforeAll(async () => {
        await database.migrate.latest()
        await database.seed.run()
    })

    afterAll(async () => {
        await database.migrate.rollback()
    })

    it('will call IsAuthorised', () => {
        expect.assertions(1)

        return request(app)
            .post('/list')
            .send({})
            .then(() => {
                expect(IsAuthorised).toBeCalled()
            })
    })

    it('will return 200 and create a new list for the user', () => {
        expect.assertions(4)

        return request(app)
            .post('/list')
            .send({
                name: 'New List',
                description: 'Test Description',
                emoji: '😍',
            })
            .then((res) => {
                expect(res.statusCode).toEqual(200)
                expect(res.body).toMatchObject({
                    data: { id: 1 },
                })

                const lists = new ListsLib()

                return lists.getListsForUser(1)
            })
            .then((lists) => {
                expect(lists.length).toEqual(1)
                expect(lists[0]).toEqual({
                    id: 1,
                    name: 'New List',
                    description: 'Test Description',
                    emoji: '😍',
                })
            })
    })
})
