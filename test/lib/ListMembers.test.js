const { database } = require('../../util/Database')
const mockDb = require('mock-knex')
const tracker = mockDb.getTracker()
const { ListMembersLib } = require('../../lib/ListMembers')

beforeEach(() => {
    mockDb.mock(database)
    tracker.install()
})

afterEach(() => {
    tracker.uninstall()
    mockDb.unmock(database)
})

describe('addMemberToList', () => {
    const userId = 10
    const listId = 20
    const addUserId = 30

    const listMembers = new ListMembersLib()

    const isListMember = jest.spyOn(listMembers, 'isListMember')

    afterEach(() => {
        isListMember.mockReset()
    })

    it('can add a user to a list if they do not exist already', () => {
        expect.assertions(2)

        tracker.on('query', (query) => {
            expect(query.method).toEqual('insert')
            query.response()
        })

        isListMember.mockResolvedValue(false)

        return listMembers
            .addMemberToList(listId, userId, addUserId)
            .then(() => {
                expect(isListMember).toBeCalledWith(listId, addUserId)
            })
    })

    it('will not add a user to a list if they already exist', () => {
        expect.assertions(1)

        isListMember.mockResolvedValue(true)

        return listMembers
            .addMemberToList(listId, userId, addUserId)
            .then(() => {
                expect(isListMember).toBeCalledWith(listId, addUserId)
            })
    })
})

describe('removeMemberFromList', () => {
    const listId = 20
    const userId = 10
    const removeUserId = 30

    const listMembers = new ListMembersLib()

    const isListMember = jest.spyOn(listMembers, 'isListMember')

    afterEach(() => {
        isListMember.mockReset()
    })

    it('can remove a member from the list', () => {
        expect.assertions(3)

        tracker.on('query', (query) => {
            expect(query.bindings).toEqual([listId, removeUserId])
            expect(query.method).toEqual('del')
            query.response()
        })

        isListMember.mockResolvedValue(true)

        return listMembers
            .removeMemberForList(listId, userId, removeUserId)
            .then(() => {
                expect(isListMember).toBeCalledWith(listId, removeUserId)
            })
    })

    it('will succeed if a user is removed that was not a member of the list', () => {
        expect.assertions(1)

        isListMember.mockResolvedValue(false)

        return listMembers
            .removeMemberForList(listId, userId, removeUserId)
            .then(() => {
                expect(isListMember).toBeCalledWith(listId, removeUserId)
            })
    })
})

describe('getMembersOfList', () => {
    const listId = 10

    const listMembers = new ListMembersLib()

    it('will get all members of a list', () => {
        expect.assertions(3)

        tracker.on('query', (query) => {
            expect(query.method).toEqual('select')
            expect(query.bindings).toEqual([listId, 1])
            query.response([
                {
                    id: 20,
                    User_id: 30,
                    List_id: listId,
                },
                {
                    id: 40,
                    User_id: 50,
                    List_id: listId,
                },
                {
                    id: 60,
                    User_id: 70,
                    List_id: listId,
                },
            ])
        })

        return listMembers.getMembersOfList(listId).then((response) => {
            expect(response).toEqual([30, 50, 70])
        })
    })

    it('will get all members of a list except one', () => {
        expect.assertions(2)

        tracker.on('query', (query) => {
            expect(query.method).toEqual('select')
            expect(query.bindings).toEqual([listId, 1, 1, 2, 3])
            query.response([
                {
                    id: 20,
                    User_id: 30,
                    List_id: listId,
                },
                {
                    id: 40,
                    User_id: 50,
                    List_id: listId,
                },
                {
                    id: 60,
                    User_id: 70,
                    List_id: listId,
                },
            ])
        })

        return listMembers.getMembersOfList(listId, [1, 2, 3])
    })
})

describe('isListMember', () => {
    const listId = 10
    const userId = 20

    const listMembers = new ListMembersLib()

    it('will return true if the user is a member of a list', () => {
        expect.assertions(3)

        tracker.on('query', (query) => {
            expect(query.method).toEqual('first')
            expect(query.bindings).toEqual([listId, userId, 1, 1])

            query.response([
                {
                    id: 30,
                    List_id: listId,
                    User_id: userId,
                },
            ])
        })

        return listMembers.isListMember(listId, userId).then((response) => {
            expect(response).toEqual(true)
        })
    })

    it('will return false if the user is not a member of the list', () => {
        expect.assertions(1)

        tracker.on('query', (query) => {
            query.response([])
        })

        return listMembers.isListMember(listId, userId).then((response) => {
            expect(response).toEqual(false)
        })
    })
})
