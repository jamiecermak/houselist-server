const request = require('supertest')
const { app } = require('../../../handler')
const { ListMembersLib } = require('../../../lib/ListMembers')
const { ListsLib } = require('../../../lib/Lists')
const { IsAuthorised } = require('../../../middleware/IsAuthorised')
const { database } = require('../../../util/Database')

jest.mock('../../../middleware/IsAuthorised')

describe('GET /list/:listId', () => {
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
            .get('/list/1')
            .then(() => {
                expect(IsAuthorised).toBeCalled()
            })
    })

    it('will return 200 and list information', () => {
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
                    .get(`/list/${listId}`)
                    .then((res) => {
                        expect(res.statusCode).toEqual(200)
                        expect(res.body).toEqual({
                            success: true,
                            message: null,
                            data: {
                                id: listId,
                                name: 'Test List',
                                description: 'Test Description',
                                emoji: '😍',
                            },
                        })
                    })
            })
    })

    it('will return 404 if user is not a member of list', () => {
        expect.assertions(2)

        const lists = new ListsLib()

        return lists
            .createList(1, 'Test List', 'Test Description', '😍')
            .then((listId) => {
                return request(app)
                    .get(`/list/${listId}`)
                    .then((res) => {
                        expect(res.statusCode).toEqual(404)
                        expect(res.body).toEqual({
                            success: false,
                            message: 'The requested list does not exist.',
                            data: null,
                        })
                    })
            })
    })

    it('will return 404 if the list is not found', () => {
        expect.assertions(2)

        return request(app)
            .get('/list/1')
            .then((res) => {
                expect(res.statusCode).toEqual(404)
                expect(res.body).toEqual({
                    success: false,
                    message: 'The requested list does not exist.',
                    data: null,
                })
            })
    })

    it('will return 400 if non id is passed', () => {
        expect.assertions(2)

        return request(app)
            .get('/list/notanid')
            .then((res) => {
                expect(res.statusCode).toEqual(400)
                expect(res.body).toEqual({
                    success: false,
                    message: 'There was an issue processing your request.',
                    data: null,
                })
            })
    })
})
