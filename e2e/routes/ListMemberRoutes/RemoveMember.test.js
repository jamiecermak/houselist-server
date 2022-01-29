const request = require('supertest')
const { app } = require('../../../handler')
const { ListMembersLib } = require('../../../lib/ListMembers')
const { ListsLib } = require('../../../lib/Lists')
const { IsAuthorised } = require('../../../middleware/IsAuthorised')
const { ListOwnerValidator } = require('../../../middleware/ListOwnerValidator')
const { database } = require('../../../util/Database')

jest.mock('../../../middleware/IsAuthorised')
jest.mock('../../../middleware/ListOwnerValidator')

describe('DELETE /list/:listId/members/:userId', () => {
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
            .delete('/list/1/members/16')
            .then(() => {
                expect(IsAuthorised).toBeCalled()
                expect(ListOwnerValidator).toBeCalled()
            })
    })

    it('will return 200 and remove a member to from the list', () => {
        expect.assertions(2)

        const lists = new ListsLib()
        const listMembers = new ListMembersLib()

        return lists
            .createList(1, 'Test List', 'Test Description', 'e')
            .then((listId) => {
                return listMembers
                    .addMemberToList(listId, 1, 2)
                    .then(() => listId)
            })
            .then((listId) => {
                return request(app)
                    .delete(`/list/${listId}/members/2`)
                    .then((res) => {
                        expect(res.statusCode).toEqual(200)
                    })
                    .then(() => listId)
            })
            .then((listId) => listMembers.isListMember(listId, 2))
            .then((isMember) => expect(isMember).toEqual(false))
    })
})
