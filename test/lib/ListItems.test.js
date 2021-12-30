const { database } = require('../../util/Database')
const mockDb = require('mock-knex')
const sinon = require('sinon')
const { ListMembersLib } = require('../../lib/ListMembers')
const { ListItemsLib } = require('../../lib/ListItems')
const tracker = mockDb.getTracker()

beforeEach(() => {
    mockDb.mock(database)
    tracker.install()
})

afterEach(() => {
    tracker.uninstall()
    mockDb.unmock(database)
})

describe('addItemToList', () => {
    it('can add a valid item to a list', () => {
        expect.assertions(4)

        const listId = 10
        const userId = 20
        const payload = {
            name: 'Test Item',
            description: 'Test D',
            priority: 0,
            emoji: '🥑',
        }

        tracker.on('query', (query) => {
            expect(query.method).toEqual('insert')
            query.response([
                {
                    id: 30,
                },
            ])
        })

        const isListMember = sinon
            .stub(ListMembersLib.prototype, 'isListMember')
            .resolves(true)

        const listItems = new ListItemsLib()

        return listItems
            .addItemToList(listId, userId, payload)
            .then((response) => {
                expect(typeof response).toEqual('number')
                expect(response).toEqual(30)
                expect(isListMember.calledWith(listId, userId)).toEqual(true)
            })
            .finally(() => {
                isListMember.restore()
            })
    })

    it('will throw an error if the user is not a member of the list', () => {
        const listId = 10
        const userId = 20
        const payload = {
            name: 'Test Item',
            description: 'Test D',
            priority: 0,
            emoji: '🥑',
        }

        const isListMember = sinon
            .stub(ListMembersLib.prototype, 'isListMember')
            .resolves(false)

        const listItems = new ListItemsLib()

        return listItems
            .addItemToList(listId, userId, payload)
            .catch((ex) => {
                expect(ex).toBeInstanceOf(Error)
                expect(ex.message).toEqual(
                    'Can not create list item as User 20 is not a member of List 10',
                )
            })
            .finally(() => {
                isListMember.restore()
            })
    })

    it('will throw an error if invalid payload', () => {
        const listId = 10
        const userId = 20
        const payload = {
            description: 'Test D',
            priority: 0,
            emoji: '🥑',
        }

        const listItems = new ListItemsLib()

        return listItems.addItemToList(listId, userId, payload).catch((ex) => {
            expect(ex).toBeInstanceOf(Error)
            expect(ex.message).toEqual('Invalid Payload')
        })
    })

    it('will throw an error if extra options are provided', () => {
        const listId = 10
        const userId = 20
        const payload = {
            name: 'Test Item',
            description: 'Test D',
            priority: 0,
            emoji: '🥑',
            extraOptions: true,
        }

        const listItems = new ListItemsLib()

        return listItems.addItemToList(listId, userId, payload).catch((ex) => {
            expect(ex).toBeInstanceOf(Error)
            expect(ex.message).toEqual('Invalid Payload')
        })
    })
})

describe('isListItemCreator', () => {
    it('returns true when the user created the item', () => {
        const userId = 10
        const listItemId = 20

        tracker.on('query', (query) => {
            expect(query.method).toEqual('first')
            query.response([
                {
                    id: 30,
                },
            ])
        })

        const listItems = new ListItemsLib()

        return listItems
            .isListItemCreator(listItemId, userId)
            .then((response) => {
                expect(response).toEqual(true)
            })
    })

    it('returns false if the user did not create the item', () => {
        const userId = 10
        const listItemId = 20

        tracker.on('query', (query) => {
            query.response([])
        })

        const listItems = new ListItemsLib()

        return listItems
            .isListItemCreator(listItemId, userId)
            .then((response) => {
                expect(response).toEqual(false)
            })
    })
})

describe('List Items Lib', () => {
    it.todo('can resolve a list item if a member of the list')

    it.todo('can delete a list item if the user created it')

    it.todo(
        'can change the name and description of a list item if the user created it',
    )
})
