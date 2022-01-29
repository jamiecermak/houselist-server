const request = require('supertest')
const { app } = require('../../../handler')
const { ListMembersLib } = require('../../../lib/ListMembers')
const { ListsLib } = require('../../../lib/Lists')
const { IsAuthorised } = require('../../../middleware/IsAuthorised')
const { ListOwnerValidator } = require('../../../middleware/ListOwnerValidator')
const { database } = require('../../../util/Database')

jest.mock('../../../middleware/IsAuthorised')
jest.mock('../../../middleware/ListOwnerValidator')

describe('POST /list/:listId/members', () => {
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
            .post('/list/1/members')
            .send({
                User_id: 2,
            })
            .then(() => {
                expect(IsAuthorised).toBeCalled()
                expect(ListOwnerValidator).toBeCalled()
            })
    })

    it('will return 200 and add a member to a list', () => {
        expect.assertions(2)

        return lists
            .createList(1, 'Test List', 'Test Description', 'e')
            .then((listId) => {
                return request(app)
                    .post(`/list/${listId}/members`)
                    .send({
                        User_id: 2,
                    })
                    .then((res) => {
                        expect(res.statusCode).toEqual(200)

                        return listId
                    })
            })
            .then((listId) => listMembers.isListMember(listId, 2))
            .then((isMember) => expect(isMember).toEqual(true))
    })
})
