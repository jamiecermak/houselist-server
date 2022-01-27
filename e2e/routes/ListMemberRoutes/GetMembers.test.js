const request = require('supertest')
const { app } = require('../../../handler')
const { ListMembersLib } = require('../../../lib/ListMembers')
const { ListsLib } = require('../../../lib/Lists')
const { IsAuthorised } = require('../../../middleware/IsAuthorised')
const { database } = require('../../../util/Database')

jest.mock('../../../middleware/IsAuthorised')

describe('GET /list/:listId/members', () => {
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
            .get('/list/1/members')
            .then(() => {
                expect(IsAuthorised).toBeCalled()
            })
    })

    it('will return 200 and return members of a list', () => {
        expect.assertions(2)

        const lists = new ListsLib()
        const listMembers = new ListMembersLib()

        return lists
            .createList(1, 'Test List', 'Test Description', 'e')
            .then((listId) => {
                return listMembers.addMemberToList(1, listId, 1).then(() => {
                    return listId
                })
            })
            .then((listId) => {
                return listMembers.addMemberToList(1, listId, 2).then(() => {
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

    it('will return 403 if not a member of the list', () => {
        expect.assertions(2)

        const lists = new ListsLib()
        const listMembers = new ListMembersLib()

        return lists
            .createList(2, 'Test List', 'Test Description', 'e')
            .then((listId) => {
                return listMembers.addMemberToList(2, listId, 3).then(() => {
                    return listId
                })
            })
            .then((listId) => {
                return request(app).get(`/list/${listId}/members`)
            })
            .then((res) => {
                expect(res.statusCode).toEqual(403)
                expect(res.body).toMatchObject({
                    success: false,
                    message:
                        'You do not have permission to perform this action.',
                })
            })
    })
})
