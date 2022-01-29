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

describe('GET /list/:listId/items', () => {
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
            .get('/list/1/items')
            .then(() => {
                expect(IsAuthorised).toBeCalled()
                expect(ListMemberValidator).toBeCalled()
            })
    })

    it('will return 200 and list items', () => {
        expect.assertions(2)

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
                    .get(`/list/${listId}/items`)
                    .then((res) => ({ itemId, res }))
            })
            .then(({ itemId, res }) => {
                expect(res.statusCode).toEqual(200)
                expect(res.body).toMatchObject({
                    success: true,
                    data: [
                        {
                            id: itemId,
                            name: 'Item name',
                            description: 'Item description',
                            emoji: '🍯',
                        },
                    ],
                })
            })
    })

    it('will return only resolved items', () => {
        expect.assertions(3)

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
                return listItems
                    .resolveItem(itemId, 1)
                    .then(() => ({ listId, resolvedItemId: itemId }))
            })
            .then(({ listId, resolvedItemId }) =>
                listItems
                    .addItemToList(listId, 1, {
                        name: 'Item name2',
                        description: 'Item description2',
                        emoji: '🍯',
                        priority: ListPrioritiesLib.getDefaultPriority(),
                    })
                    .then((unresolvedItemId) => ({
                        listId,
                        resolvedItemId,
                        unresolvedItemId,
                    })),
            )
            .then(({ listId, resolvedItemId }) => {
                return request(app)
                    .get(`/list/${listId}/items?resolved=true`)
                    .then((res) => ({ resolvedItemId, res }))
            })
            .then(({ resolvedItemId, res }) => {
                expect(res.statusCode).toEqual(200)
                expect(res.body.data.length).toEqual(1)
                expect(res.body).toMatchObject({
                    success: true,
                    data: [
                        {
                            id: resolvedItemId,
                            name: 'Item name',
                            description: 'Item description',
                            emoji: '🍯',
                        },
                    ],
                })
            })
    })

    it('will return only unresolved items', () => {
        expect.assertions(3)

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
                return listItems
                    .resolveItem(itemId, 1)
                    .then(() => ({ listId, resolvedItemId: itemId }))
            })
            .then(({ listId, resolvedItemId }) =>
                listItems
                    .addItemToList(listId, 1, {
                        name: 'Item name2',
                        description: 'Item description2',
                        emoji: '🍯',
                        priority: ListPrioritiesLib.getDefaultPriority(),
                    })
                    .then((unresolvedItemId) => ({
                        listId,
                        resolvedItemId,
                        unresolvedItemId,
                    })),
            )
            .then(({ listId, unresolvedItemId }) => {
                return request(app)
                    .get(`/list/${listId}/items?resolved=false`)
                    .then((res) => ({ unresolvedItemId, res }))
            })
            .then(({ unresolvedItemId, res }) => {
                expect(res.statusCode).toEqual(200)
                expect(res.body.data.length).toEqual(1)
                expect(res.body).toMatchObject({
                    success: true,
                    data: [
                        {
                            id: unresolvedItemId,
                            name: 'Item name2',
                            description: 'Item description2',
                            emoji: '🍯',
                            is_resolved: false,
                        },
                    ],
                })
            })
    })
})
