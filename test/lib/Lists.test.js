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

        tracker.on('query', (query, step) => {
            return [
                () => {
                    expect(query.method).toEqual('first')
                    query.response([
                        {
                            id: 20,
                            CreatedBy_id: 10,
                        },
                    ])
                },
                () => {
                    expect(query.method).toEqual('del')
                    query.response()
                },
            ][step - 1]()
        })

        const lists = new ListsLib()

        return lists.deleteList(userId, listId)
    })

    it('can not delete a list if the user did not create it', () => {
        expect.assertions(3)

        const userId = 10
        const listId = 20

        tracker.on('query', (query, step) => {
            expect(query.method).toEqual('first')
            query.response([
                {
                    id: 20,
                    CreatedBy_id: 30,
                },
            ])
        })

        const lists = new ListsLib()

        return lists.deleteList(userId, listId).catch((ex) => {
            expect(ex).toBeInstanceOf(Error)
            expect(ex.message).toEqual(
                'Can not delete List 20 as User 10 did not create it',
            )
        })
    })
})

describe('Lists Lib', () => {
    it.todo('can change the name of a list if they are the owner')
})
