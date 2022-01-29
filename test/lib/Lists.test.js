const { database } = require('../../util/Database')
const mockDb = require('mock-knex')
const { ListsLib } = require('../../lib/Lists')
const {
    ServerValidationError,
    ServerNotFoundError,
} = require('../../util/ServerErrors')
const tracker = mockDb.getTracker()

beforeEach(() => {
    mockDb.mock(database)
    tracker.install()
})

afterEach(() => {
    tracker.uninstall()
    mockDb.unmock(database)
})

describe('createList', () => {
    const userId = 20
    const listName = 'Test List'
    const listDescription = "It's a test list"
    const listEmoji = '🥑'

    const lists = new ListsLib()

    it('can create a list for a given user id', () => {
        expect.assertions(2)

        tracker.on('query', (query) => {
            expect(query.method).toEqual('insert')

            query.response([1])
        })

        return lists
            .createList(userId, listName, listDescription, listEmoji)
            .then((listId) => {
                expect(typeof listId).toEqual('number')
            })
    })

    it('can create a list with a default emoji', () => {
        expect.assertions(1)

        tracker.on('query', (query) => {
            query.response([1])
        })

        return lists
            .createList(userId, listName, listDescription, null)
            .then((listId) => {
                expect(typeof listId).toEqual('number')
            })
    })

    it('can create a list with no emoji specified', () => {
        expect.assertions(1)

        tracker.on('query', (query) => {
            query.response([1])
        })

        return lists
            .createList(userId, listName, listDescription)
            .then((listId) => {
                expect(typeof listId).toEqual('number')
            })
    })

    it('will throw an error if no rows are inserted', () => {
        expect.assertions(4)

        tracker.on('query', (query) => {
            query.response([])
        })

        const lists = new ListsLib()

        return lists
            .createList(userId, listName, listDescription, listEmoji)
            .catch((ex) => {
                expect(ex).toBeInstanceOf(ServerValidationError)
                expect(ex.message).toContain(
                    'Could not create list for User ID 20',
                )
                expect(ex.humanMessage).toContain('Could not create list')
                expect(ex.humanMessage).not.toContain('for User ID 20')
            })
    })
})

describe('deleteList', () => {
    const listId = 20
    const lists = new ListsLib()

    it('can delete a list ', () => {
        expect.assertions(1)

        tracker.on('query', (query) => {
            expect(query.method).toEqual('del')
            query.response()
        })

        return lists.deleteList(listId)
    })
})

describe('updateList', () => {
    const lists = new ListsLib()

    const userId = 10
    const listId = 20
    const listName = 'New List Name'
    const listDescription = 'New List Description'
    const listEmoji = '🐝'

    it('can update the lists name, description and emoji', () => {
        expect.assertions(2)

        tracker.on('query', (query) => {
            expect(query.bindings).toEqual([
                listName,
                listDescription,
                listEmoji,
                listId,
                userId,
            ])
            expect(query.method).toEqual('update')
            query.response()
        })

        return lists.updateList(listId, userId, {
            name: listName,
            description: listDescription,
            emoji: listEmoji,
        })
    })

    it('will throw an error if unexpected options are provided', () => {
        expect.assertions(1)

        return lists
            .updateList(listId, userId, {
                name: listName,
                description: listDescription,
                emoji: listEmoji,
                unexpectedOption: true,
            })
            .catch((ex) => {
                expect(ex).toBeInstanceOf(ServerValidationError)
            })
    })

    it('will throw an error if no options are provided', () => {
        expect.assertions(1)

        return lists.updateList(listId, userId, {}).catch((ex) => {
            expect(ex).toBeInstanceOf(ServerValidationError)
        })
    })

    it('will throw an error if unexpected options types are provided', () => {
        expect.assertions(1)

        return lists
            .updateList(listId, userId, {
                name: listName,
                description: listDescription,
                emoji: listEmoji,
                unexpectedOption: true,
            })
            .catch((ex) => {
                expect(ex).toBeInstanceOf(ServerValidationError)
            })
    })
})

describe('isListOwner', () => {
    const lists = new ListsLib()

    const userId = 10
    const listId = 20

    it('will return true if the userId is the owner of listId', () => {
        expect.assertions(3)

        tracker.on('query', (query) => {
            expect(query.method).toEqual('first')
            expect(query.bindings).toEqual([listId, userId, 1])
            query.response([
                {
                    id: 20,
                    CreatedBy_id: 10,
                },
            ])
        })

        return lists
            .isListOwner(listId, userId)
            .then((isOwner) => expect(isOwner).toEqual(true))
    })

    it('will return false if the userId is not the owner of listId', () => {
        expect.assertions(2)

        tracker.on('query', (query) => {
            expect(query.bindings).toEqual([listId, userId, 1])
            query.response([])
        })

        return lists
            .isListOwner(listId, userId)
            .then((isOwner) => expect(isOwner).toEqual(false))
    })
})

describe('getListsForUser', () => {
    const lists = new ListsLib()

    const userId = 10

    it('will return an array of lists for a user id', () => {
        expect.assertions(1)

        tracker.on('query', (query) => {
            query.response([
                {
                    id: 1,
                    name: 'Test List',
                    description: 'Test Description',
                    emoji: '😍',
                },
            ])
        })

        return lists.getListsForUser(userId).then((response) => {
            expect(response).toEqual([
                {
                    id: 1,
                    name: 'Test List',
                    description: 'Test Description',
                    emoji: '😍',
                },
            ])
        })
    })

    it('will return an empty array if there are no lists', () => {
        expect.assertions(1)

        tracker.on('query', (query) => {
            query.response([])
        })

        return lists.getListsForUser(userId).then((response) => {
            expect(response).toEqual([])
        })
    })
})

describe('getList', () => {
    const lists = new ListsLib()

    const listId = 10

    it('will return list information', () => {
        expect.assertions(1)

        tracker.on('query', (query) => {
            query.response([
                {
                    id: listId,
                    name: 'Test List',
                    description: 'Test Description',
                    emoji: '😍',
                },
            ])
        })

        return lists.getList(listId).then((response) => {
            expect(response).toEqual({
                id: listId,
                name: 'Test List',
                description: 'Test Description',
                emoji: '😍',
            })
        })
    })

    it('will throw a not found error if the list does not exist', () => {
        expect.assertions(1)

        tracker.on('query', (query) => {
            query.response([])
        })

        return lists.getList(listId).catch((ex) => {
            expect(ex).toBeInstanceOf(ServerNotFoundError)
        })
    })
})
