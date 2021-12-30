const { database } = require('../../util/Database')
const mockDb = require('mock-knex')
const tracker = mockDb.getTracker()
const sinon = require('sinon')
const { ListMembersLib } = require('../../lib/ListMembers')
const { ListsLib } = require('../../lib/Lists')

beforeEach(() => {
    mockDb.mock(database)
    tracker.install()
})

afterEach(() => {
    tracker.uninstall()
    mockDb.unmock(database)
})

describe('addMemberToList', () => {
    it('can add a user to a list if they do not exist already', () => {
        expect.assertions(2)
        const userId = 10
        const listId = 20
        const addUserId = 30

        tracker.on('query', (query) => {
            expect(query.method).toEqual('insert')
            query.response()
        })

        const isListOwner = sinon
            .stub(ListsLib.prototype, 'isListOwner')
            .resolves(true)

        const listItems = new ListMembersLib()

        const isListMember = jest
            .spyOn(listItems, 'isListMember')
            .mockResolvedValue(false)

        return listItems
            .addMemberToList(userId, listId, addUserId)
            .then(() => {
                expect(isListMember).toBeCalledWith(listId, addUserId)
                expect(isListOwner.calledWith(listId, userId))
            })
            .finally(() => {
                isListOwner.restore()
            })
    })

    it('will throw an error if a user who is not the owner tries to add the user', () => {
        expect.assertions(3)
        const userId = 10
        const listId = 20
        const addUserId = 30

        const isListOwner = sinon
            .stub(ListsLib.prototype, 'isListOwner')
            .resolves(false)

        const listItems = new ListMembersLib()

        return listItems
            .addMemberToList(userId, listId, addUserId)
            .catch((ex) => {
                expect(ex).toBeInstanceOf(Error)
                expect(ex.message).toEqual(
                    'Can not add User 30 to List 20 as User 10 is not the owner',
                )
                expect(isListOwner.calledWith(listId, userId)).toEqual(true)
            })
            .finally(() => {
                isListOwner.restore()
            })
    })

    it('will not add a user to a list if they already exist', () => {
        expect.assertions(1)
        const userId = 10
        const listId = 20
        const addUserId = 30

        const isListOwner = sinon
            .stub(ListsLib.prototype, 'isListOwner')
            .resolves(true)

        const listItems = new ListMembersLib()

        const isListMember = jest
            .spyOn(listItems, 'isListMember')
            .mockResolvedValue(true)

        return listItems
            .addMemberToList(userId, listId, addUserId)
            .then(() => {
                expect(isListMember).toBeCalledWith(listId, addUserId)
            })
            .finally(() => {
                isListOwner.restore()
            })
    })
})

describe('removeMemberFromList', () => {
    it('can remove a member from the list', () => {
        expect.assertions(3)
        const userId = 10
        const listId = 20
        const addUserId = 30

        tracker.on('query', (query) => {
            expect(query.method).toEqual('del')
            query.response()
        })

        const isListOwner = sinon
            .stub(ListsLib.prototype, 'isListOwner')
            .resolves(true)

        const listMembers = new ListMembersLib()

        const isListMember = jest
            .spyOn(listMembers, 'isListMember')
            .mockResolvedValue(true)

        return listMembers
            .removeMemberForList(userId, listId, addUserId)
            .then(() => {
                expect(isListOwner.calledWith(listId, userId)).toEqual(true)
                expect(isListMember).toBeCalledWith(listId, addUserId)
            })
            .finally(() => {
                isListOwner.restore()
            })
    })

    it('will throw an error if a user who is not the owner attempts to remove a user', () => {
        expect.assertions(2)
        const userId = 10
        const listId = 20
        const addUserId = 30

        const isListOwner = sinon
            .stub(ListsLib.prototype, 'isListOwner')
            .resolves(false)

        const listMembers = new ListMembersLib()

        return listMembers
            .removeMemberForList(userId, listId, addUserId)
            .catch((ex) => {
                expect(ex).toBeInstanceOf(Error)
                expect(ex.message).toEqual(
                    'Can not remove User 30 from List 20 as User 10 is not the owner',
                )
            })
            .finally(() => {
                isListOwner.restore()
            })
    })

    it('will succeed if a user is removed that was not a member of the list', () => {
        expect.assertions(2)
        const userId = 10
        const listId = 20
        const addUserId = 30

        const isListOwner = sinon
            .stub(ListsLib.prototype, 'isListOwner')
            .resolves(true)

        const listMembers = new ListMembersLib()

        const isListMember = jest
            .spyOn(listMembers, 'isListMember')
            .mockResolvedValue(false)

        return listMembers
            .removeMemberForList(userId, listId, addUserId)
            .then(() => {
                expect(isListOwner.calledWith(listId, userId)).toEqual(true)
                expect(isListMember).toBeCalledWith(listId, addUserId)
            })
            .finally(() => {
                isListOwner.restore()
            })
    })

    it('will throw an error if a user attempts to remove themselves from the list as owner', () => {
        expect.assertions(2)

        const userId = 10
        const listId = 20
        const removeUserId = 10

        const isListOwner = sinon
            .stub(ListsLib.prototype, 'isListOwner')
            .resolves(true)

        const listMembers = new ListMembersLib()

        return listMembers
            .removeMemberForList(userId, listId, removeUserId)
            .catch((ex) => {
                expect(ex).toBeInstanceOf(Error)
                expect(ex.message).toEqual('Can not remove the owner of a list')
            })
            .finally(() => {
                isListOwner.restore()
            })
    })
})

describe('getMembersOfList', () => {
    it('will get all members of a list', () => {
        expect.assertions(3)

        const listId = 10

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

        const listMembers = new ListMembersLib()

        return listMembers.getMembersOfList(listId).then((response) => {
            expect(response).toEqual([30, 50, 70])
        })
    })

    it('will get all members of a list except one', () => {
        expect.assertions(2)

        const listId = 10

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

        const listMembers = new ListMembersLib()

        return listMembers.getMembersOfList(listId, [1, 2, 3])
    })
})

describe('isListMember', () => {
    it('will return true if the user is a member of a list', () => {
        expect.assertions(3)
        const listId = 10
        const userId = 20

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

        const listMembers = new ListMembersLib()

        return listMembers.isListMember(listId, userId).then((response) => {
            expect(response).toEqual(true)
        })
    })

    it('will return false if the user is not a member of the list', () => {
        expect.assertions(1)
        const listId = 10
        const userId = 20

        tracker.on('query', (query) => {
            query.response([])
        })

        const listMembers = new ListMembersLib()

        return listMembers.isListMember(listId, userId).then((response) => {
            expect(response).toEqual(false)
        })
    })
})
