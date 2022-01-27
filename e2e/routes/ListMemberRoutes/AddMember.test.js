const request = require('supertest')
const { app } = require('../../../handler')
const { ListMembersLib } = require('../../../lib/ListMembers')
const { ListsLib } = require('../../../lib/Lists')
const { IsAuthorised } = require('../../../middleware/IsAuthorised')
const { database } = require('../../../util/Database')

jest.mock('../../../middleware/IsAuthorised')

describe('POST /list/:listId/members', () => {
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
            .post('/list/1/members')
            .send({
                User_id: 2,
            })
            .then(() => {
                expect(IsAuthorised).toBeCalled()
            })
    })

    it('will return 200 and add a member to a list', () => {
        expect.assertions(2)

        const lists = new ListsLib()
        const listMembers = new ListMembersLib()

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

    it('will return 403 if not the owner of the list', () => {
        expect.assertions(1)

        const lists = new ListsLib()

        return lists
            .createList(2, 'Test List', 'Test Description', 'e')
            .then((listId) => {
                return request(app).post(`/list/${listId}/members`).send({
                    User_id: 3,
                })
            })

            .then((res) => {
                expect(res.statusCode).toEqual(403)
            })
    })
})
