const request = require('supertest')
const { app } = require('../../../handler')
const { ListItemsLib } = require('../../../lib/ListItems')
const { ListPrioritiesLib } = require('../../../lib/ListPriorities')
const { ListsLib } = require('../../../lib/Lists')
const { IsAuthorised } = require('../../../middleware/IsAuthorised')
const {
    ListMemberValidator,
} = require('../../../middleware/ListMemberValidator')
const { database } = require('../../../util/Database')

jest.mock('../../../middleware/IsAuthorised')
jest.mock('../../../middleware/ListMemberValidator')

describe('POST /list/:listId/items', () => {
    const lists = new ListsLib()
    const listItems = new ListItemsLib()

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
            .post('/list/1/items')
            .send({
                name: 'Item name',
                description: 'Item description',
                emoji: '🍯',
                priority: ListPrioritiesLib.getDefaultPriority(),
            })
            .then(() => {
                expect(IsAuthorised).toBeCalled()
                expect(ListMemberValidator).toBeCalled()
            })
    })

    it('will return 200 and add an item to the list', () => {
        expect.assertions(4)

        return lists
            .createList(1, 'Test List', 'Test Description', 'e')
            .then((listId) => {
                return request(app)
                    .post(`/list/${listId}/items`)
                    .send({
                        name: 'Item name',
                        description: 'Item description',
                        emoji: '🍯',
                        priority: ListPrioritiesLib.getDefaultPriority(),
                    })
                    .then((res) => {
                        expect(res.statusCode).toEqual(200)
                        expect(res.body).toMatchObject({
                            success: true,
                        })

                        const itemId = res.body.data.id

                        return { listId, itemId }
                    })
            })
            .then(({ listId, itemId }) => {
                return listItems.getItems(listId).then((items) => {
                    return { listId, itemId, items }
                })
            })
            .then(({ itemId, items }) => {
                expect(items.length).toEqual(1)
                expect(items[0]).toMatchObject({
                    id: itemId,
                    CreatedBy_id: 1,
                    UpdatedBy_id: 1,
                    name: 'Item name',
                    description: 'Item description',
                    emoji: '🍯',
                    Priority_id: ListPrioritiesLib.getDefaultPriority(),
                    is_resolved: false,
                })
            })
    })
})
