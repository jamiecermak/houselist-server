const request = require('supertest')
const { app } = require('../../../handler')
const { ListMembersLib } = require('../../../lib/ListMembers')
const { ListsLib } = require('../../../lib/Lists')
const { IsAuthorised } = require('../../../middleware/IsAuthorised')
const {
    ListMemberValidator,
} = require('../../../middleware/ListMemberValidator')
const { database } = require('../../../util/Database')

jest.mock('../../../middleware/IsAuthorised')
jest.mock('../../../middleware/ListMemberValidator')

describe('GET /list/:listId/members', () => {
    const lists = new ListsLib()
    const listMembers = new ListMembersLib()

    beforeEach(async () => {
        await database.migrate.latest()
        await database.seed.run()
    })

    afterEach(async () => {
        await database.migrate.rollback()
    })

    it('will call middleware', () => {
        expect.assertions(2)

        return request(app)
            .get('/list/1/members')
            .then(() => {
                expect(IsAuthorised).toBeCalled()
                expect(ListMemberValidator).toBeCalled()
            })
    })

    it('will return 200 and return members of a list', () => {
        expect.assertions(2)

        return lists
            .createList(1, 'Test List', 'Test Description', 'e')
            .then((listId) => {
                return listMembers.addMemberToList(listId, 1, 1).then(() => {
                    return listId
                })
            })
            .then((listId) => {
                return listMembers.addMemberToList(listId, 1, 2).then(() => {
                    return listId
                })
            })
            .then((listId) => {
                return request(app).get(`/list/${listId}/members`)
            })
            .then((res) => {
                expect(res.statusCode).toEqual(200)
                expect(res.body).toEqual({
                    success: true,
                    data: [
                        {
                            id: 1,
                            name: 'John Smith',
                            profile_image_url: null,
                        },
                        {
                            id: 2,
                            name: 'Jane Doe',
                            profile_image_url: null,
                        },
                    ],
                    message: null,
                })
            })
    })
})
