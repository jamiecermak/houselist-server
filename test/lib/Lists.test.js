const { database } = require('../../util/Database')
const mockDb = require('mock-knex')
const { ListsLib } = require('../../lib/Lists')
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
    it('can create a list for a given user id', () => {
        const userId = 20
        const listName = 'Test List'
        const listDescription = "It's a test list"
        const listEmoji = '🥑'

        tracker.on('query', (query) => {
            expect(query.method).toEqual('insert')

            query.response([
                {
                    id: 1,
                },
            ])
        })

        const lists = new ListsLib()

        return lists
            .createList(userId, listName, listDescription, listEmoji)
            .then((listId) => {
                expect(typeof listId).toEqual('number')
            })
    })

    it('can create a list with a default emoji', () => {
        expect.assertions(1)

        const userId = 20
        const listName = 'Test List'
        const listDescription = "It's a test list"
        const listEmoji = null

        tracker.on('query', (query) => {
            query.response([
                {
                    id: 1,
                },
            ])
        })

        const lists = new ListsLib()

        return lists
            .createList(userId, listName, listDescription, listEmoji)
            .then((listId) => {
                expect(typeof listId).toEqual('number')
            })
    })

    it('can create a list with no emoji specified', () => {
        expect.assertions(1)

        const userId = 20
        const listName = 'Test List'
        const listDescription = "It's a test list"

        tracker.on('query', (query) => {
            query.response([
                {
                    id: 1,
                },
            ])
        })

        const lists = new ListsLib()

        return lists
            .createList(userId, listName, listDescription)
            .then((listId) => {
                expect(typeof listId).toEqual('number')
            })
    })

    it('will throw an error if no rows are inserted', () => {
        expect.assertions(2)

        const userId = 20
        const listName = 'Test List'
        const listDescription = "It's a test list"
        const listEmoji = '🥑'

        tracker.on('query', (query) => {
            query.response([])
        })

        const lists = new ListsLib()

        return lists
            .createList(userId, listName, listDescription, listEmoji)
            .catch((ex) => {
                expect(ex).toBeInstanceOf(Error)
                expect(ex.message).toEqual(
                    'Could not create list for User ID 20',
                )
            })
    })
})

describe('deleteList', () => {
    it('can delete a list if the user created it', () => {
        expect.assertions(2)

        const userId = 10
        const listId = 20

        tracker.on('query', (query) => {
            expect(query.method).toEqual('del')
            query.response()
        })

        const lists = new ListsLib()

        const isListOwner = jest
            .spyOn(lists, 'isListOwner')
            .mockResolvedValue(true)

        return lists.deleteList(userId, listId).then(() => {
            expect(isListOwner).toBeCalledWith(userId, listId)
        })
    })

    it('can not delete a list if the user did not create it', () => {
        expect.assertions(3)

        const userId = 10
        const listId = 20

        const lists = new ListsLib()

        const isListOwner = jest
            .spyOn(lists, 'isListOwner')
            .mockResolvedValue(false)

        return lists.deleteList(userId, listId).catch((ex) => {
            expect(isListOwner).toBeCalledWith(userId, listId)
            expect(ex).toBeInstanceOf(Error)
            expect(ex.message).toEqual(
                'Can not delete List 20 as User 10 did not create it',
            )
        })
    })
})

describe('updateList', () => {
    it('can update the lists name, description and emoji', () => {
        expect.assertions(2)

        const userId = 10
        const listId = 20
        const listName = 'New List Name'
        const listDescription = 'New List Description'
        const listEmoji = '🐝'

        tracker.on('query', (query) => {
            expect(query.method).toEqual('update')
            query.response()
        })

        const lists = new ListsLib()

        const isListOwner = jest
            .spyOn(lists, 'isListOwner')
            .mockResolvedValue(true)

        return lists
            .updateList(userId, listId, {
                name: listName,
                description: listDescription,
                emoji: listEmoji,
            })
            .then(() => {
                expect(isListOwner).toBeCalledWith(userId, listId)
            })
    })

    it('will throw an error if a user who was not the creator updates the list', () => {
        expect.assertions(3)

        const userId = 30
        const listId = 20
        const listName = 'New List Name'
        const listDescription = 'New List Description'
        const listEmoji = '🐝'

        const lists = new ListsLib()

        const isListOwner = jest
            .spyOn(lists, 'isListOwner')
            .mockResolvedValue(false)

        return lists
            .updateList(userId, listId, {
                name: listName,
                description: listDescription,
                emoji: listEmoji,
            })
            .catch((ex) => {
                expect(ex).toBeInstanceOf(Error)
                expect(ex.message).toEqual(
                    'Can not modify List 20 as User 30 did not create it',
                )
                expect(isListOwner).toBeCalledWith(userId, listId)
            })
    })

    it('will throw an error if unexpected options are provided', () => {
        expect.assertions(2)

        const userId = 30
        const listId = 20
        const listName = 'New List Name'
        const listDescription = 'New List Description'
        const listEmoji = '🐝'

        const lists = new ListsLib()

        return lists
            .updateList(userId, listId, {
                name: listName,
                description: listDescription,
                emoji: listEmoji,
                unexpectedOption: true,
            })
            .catch((ex) => {
                expect(ex).toBeInstanceOf(Error)
                expect(ex.message).toEqual(
                    'Invalid list update payload (Validation failed)',
                )
            })
    })

    it('will throw an error if no options are provided', () => {
        expect.assertions(2)

        const userId = 30
        const listId = 20

        const lists = new ListsLib()

        return lists.updateList(userId, listId, {}).catch((ex) => {
            expect(ex).toBeInstanceOf(Error)
            expect(ex.message).toEqual(
                'Invalid list update payload (No options provided)',
            )
        })
    })

    it('will throw an error if unexpected options types are provided', () => {
        expect.assertions(2)

        const userId = 30
        const listId = 20
        const listName = 'New List Name'
        const listDescription = 1000
        const listEmoji = '🐝'

        const lists = new ListsLib()

        return lists
            .updateList(userId, listId, {
                name: listName,
                description: listDescription,
                emoji: listEmoji,
                unexpectedOption: true,
            })
            .catch((ex) => {
                expect(ex).toBeInstanceOf(Error)
                expect(ex.message).toEqual(
                    'Invalid list update payload (Validation failed)',
                )
            })
    })
})

describe('isListOwner', () => {
    it('will return true if the userId is the owner of listId', () => {
        expect.assertions(2)

        const userId = 10
        const listId = 20

        tracker.on('query', (query) => {
            expect(query.method).toEqual('first')
            query.response([
                {
                    id: 20,
                    CreatedBy_id: 10,
                },
            ])
        })

        const lists = new ListsLib()

        return lists
            .isListOwner(userId, listId)
            .then((isOwner) => expect(isOwner).toEqual(true))
    })

    it('will return false if the userId is not the owner of listId', () => {
        expect.assertions(1)

        const userId = 10
        const listId = 20

        tracker.on('query', (query) => {
            query.response([])
        })

        const lists = new ListsLib()

        return lists
            .isListOwner(userId, listId)
            .then((isOwner) => expect(isOwner).toEqual(false))
    })
})
