const request = require('supertest')
const { app } = require('../../../handler')
const { ListItemsLib } = require('../../../lib/ListItems')
const { ListPrioritiesLib } = require('../../../lib/ListPriorities')
const { ListsLib } = require('../../../lib/Lists')
const { IsAuthorised } = require('../../../middleware/IsAuthorised')
const { ListItemValidator } = require('../../../middleware/ListItemValidator')
const {
    ListMemberValidator,
} = require('../../../middleware/ListMemberValidator')
const { database } = require('../../../util/Database')

jest.mock('../../../middleware/IsAuthorised')
jest.mock('../../../middleware/ListMemberValidator')
jest.mock('../../../middleware/ListItemValidator')

describe('GET /list/:listId/items/:itemId/resolve', () => {
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
        expect.assertions(3)

        return request(app)
            .get('/list/1/items/1/resolve')
            .then(() => {
                expect(IsAuthorised).toBeCalled()
                expect(ListMemberValidator).toBeCalled()
                expect(ListItemValidator).toBeCalled()
            })
    })

    it('will return 200 and resolve an item', () => {
        expect.assertions(4)

        return lists
            .createList(1, 'Test List', 'Test Description', 'e')
            .then((listId) =>
                listItems
                    .addItemToList(listId, 1, {
                        name: 'Item name',
                        description: 'Item description',
                        emoji: '🍯',
                        priority: ListPrioritiesLib.getDefaultPriority(),
                    })
                    .then((itemId) => ({ listId, itemId })),
            )
            .then(({ listId, itemId }) => {
                return request(app)
                    .get(`/list/${listId}/items/${itemId}/resolve`)
                    .then((res) => {
                        expect(res.statusCode).toEqual(200)
                        expect(res.body).toMatchObject({
                            success: true,
                        })

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
                    is_resolved: true,
                    ResolvedBy_id: 1,
                })
            })
    })
})
