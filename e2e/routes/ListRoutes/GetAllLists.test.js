const request = require('supertest')
const { app } = require('../../../handler')
const { ListMembersLib } = require('../../../lib/ListMembers')
const { ListsLib } = require('../../../lib/Lists')
const { IsAuthorised } = require('../../../middleware/IsAuthorised')
const { database } = require('../../../util/Database')

jest.mock('../../../middleware/IsAuthorised')

describe('GET /list', () => {
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

    it('will return 200 and all lists', () => {
        expect.assertions(2)

        const lists = new ListsLib()

        return lists
            .createList(1, 'Test List', 'Test Description', '😍')
            .then((listId) => {
                const listMembers = new ListMembersLib()
                return listMembers
                    .addMemberToList(1, listId, 1)
                    .then(() => listId)
            })
            .then((listId) => {
                return request(app)
                    .get('/list')
                    .then((res) => {
                        expect(res.statusCode).toEqual(200)
                        expect(res.body).toEqual({
                            success: true,
                            message: null,
                            data: [
                                {
                                    id: listId,
                                    name: 'Test List',
                                    description: 'Test Description',
                                    emoji: '😍',
                                },
                            ],
                        })
                    })
            })
    })
})
