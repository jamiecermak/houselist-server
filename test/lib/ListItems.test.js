const { database } = require('../../util/Database')
const mockDb = require('mock-knex')
const sinon = require('sinon')
const { ListMembersLib } = require('../../lib/ListMembers')
const { ListItemsLib } = require('../../lib/ListItems')
const { ListPrioritiesLib } = require('../../lib/ListPriorities')
const {
    ServerPermissionsError,
    ServerValidationError,
    ServerGeneralError,
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
        expect.assertions(2)

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
                expect(ex).toBeInstanceOf(ServerPermissionsError)
                expect(ex.message).toContain(
                    'Can not create list item as User 20 is not a member of List 10',
                )
            })
            .finally(() => {
                isListMember.restore()
            })
    })

    it('will throw an error if invalid payload', () => {
        expect.assertions(1)

        const listId = 10
        const userId = 20
        const payload = {
            description: 'Test D',
            priority: 0,
            emoji: '🥑',
        }

        const listItems = new ListItemsLib()

        return listItems.addItemToList(listId, userId, payload).catch((ex) => {
            expect(ex).toBeInstanceOf(ServerValidationError)
        })
    })

    it('will throw an error if extra options are provided', () => {
        expect.assertions(1)

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
            expect(ex).toBeInstanceOf(ServerValidationError)
        })
    })
})

describe('isListItemCreator', () => {
    it('returns true when the user created the item', () => {
        expect.assertions(2)

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
        expect.assertions(1)

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

describe('resolveItem', () => {
    it('will resolve an unresolved item if the user is a member of the list', () => {
        expect.assertions(3)
        const listItemId = 10
        const listId = 20
        const userId = 30

        tracker.on('query', (query, step) => {
            return [
                () => {
                    expect(query.method).toEqual('first')
                    query.response([
                        {
                            id: 40,
                            List_id: listId,
                            is_resolved: false,
                        },
                    ])
                },
                () => {
                    expect(query.method).toEqual('update')
                    query.response()
                },
            ][step - 1]()
        })

        const isListMember = sinon
            .stub(ListMembersLib.prototype, 'isListMember')
            .resolves(true)

        const listItems = new ListItemsLib()

        return listItems
            .resolveItem(listItemId, userId)
            .then(() => {
                expect(isListMember.calledWith(listId, userId)).toEqual(true)
            })
            .finally(() => {
                isListMember.restore()
            })
    })

    it('will throw an error if a non-member attempts to resolve', () => {
        expect.assertions(3)
        const listItemId = 10
        const listId = 20
        const userId = 30

        tracker.on('query', (query) => {
            expect(query.method).toEqual('first')
            query.response([
                {
                    id: 40,
                    List_id: listId,
                    is_resolved: false,
                },
            ])
        })

        const isListMember = sinon
            .stub(ListMembersLib.prototype, 'isListMember')
            .resolves(false)

        const listItems = new ListItemsLib()

        return listItems
            .resolveItem(listItemId, userId)
            .catch((ex) => {
                expect(ex).toBeInstanceOf(ServerPermissionsError)
                expect(ex.message).toContain(
                    `User ${userId} is not a member of List ${listId}`,
                )
            })
            .finally(() => {
                isListMember.restore()
            })
    })

    it('will throw an error if the item is already resolved', () => {
        expect.assertions(3)

        const listItemId = 10
        const listId = 20
        const userId = 30

        tracker.on('query', (query) => {
            query.response([
                {
                    id: 40,
                    List_id: listId,
                    is_resolved: true,
                },
            ])
        })

        const isListMember = sinon
            .stub(ListMembersLib.prototype, 'isListMember')
            .resolves(true)

        const listItems = new ListItemsLib()

        return listItems
            .resolveItem(listItemId, userId)
            .catch((ex) => {
                expect(ex).toBeInstanceOf(ServerValidationError)
                expect(ex.message).toContain(`Item has already been resolved`)
                expect(ex.humanMessage).toContain(
                    'Item has already been resolved',
                )
            })
            .finally(() => {
                isListMember.restore()
            })
    })

    it('will throw an error if the item does not exist', () => {
        expect.assertions(3)
        const listItemId = 10
        const userId = 30

        tracker.on('query', (query) => {
            query.response([])
        })

        const listItems = new ListItemsLib()

        return listItems.resolveItem(listItemId, userId).catch((ex) => {
            expect(ex).toBeInstanceOf(ServerNotFoundError)
            expect(ex.message.toLowerCase()).toContain(`item`)
            expect(ex.humanMessage.toLowerCase()).toContain(`item`)
        })
    })
})

describe('deleteItem', () => {
    it('can delete an item if they are the user that created it', () => {
        expect.assertions(4)

        const listItemId = 10
        const listId = 20
        const userId = 30

        tracker.on('query', (query, step) => {
            return [
                () => {
                    expect(query.method).toEqual('first')
                    query.response([
                        {
                            id: listItemId,
                            CreatedBy_id: userId,
                            List_id: listId,
                            is_resolved: false,
                        },
                    ])
                },
                () => {
                    expect(query.method).toEqual('del')
                    query.response()
                },
            ][step - 1]()
        })

        const isListMember = sinon
            .stub(ListMembersLib.prototype, 'isListMember')
            .resolves(true)

        const listItems = new ListItemsLib()

        const isListItemCreator = jest
            .spyOn(listItems, 'isListItemCreator')
            .mockResolvedValue(true)

        return listItems
            .deleteItem(listItemId, userId)
            .then(() => {
                expect(isListMember.calledWith(listId, userId)).toEqual(true)
                expect(isListItemCreator).toBeCalledWith(listItemId, userId)
            })
            .finally(() => {
                isListMember.restore()
            })
    })

    it('will throw an error if it is not the user that created the item', () => {
        expect.assertions(3)

        const listItemId = 10
        const listId = 20
        const userId = 30

        tracker.on('query', (query) => {
            expect(query.method).toEqual('first')
            query.response([
                {
                    id: listItemId,
                    CreatedBy_id: userId,
                    List_id: listId,
                    is_resolved: false,
                },
            ])
        })

        const isListMember = sinon
            .stub(ListMembersLib.prototype, 'isListMember')
            .resolves(true)

        const listItems = new ListItemsLib()

        jest.spyOn(listItems, 'isListItemCreator').mockResolvedValue(false)

        return listItems
            .deleteItem(listItemId, userId)
            .catch((ex) => {
                expect(ex).toBeInstanceOf(ServerPermissionsError)
                expect(ex.message).toContain(
                    'User 30 did not create List Item 10',
                )
            })
            .finally(() => {
                isListMember.restore()
            })
    })

    it('will throw an error if the user is not a member of the list', () => {
        expect.assertions(3)

        const listItemId = 10
        const listId = 20
        const userId = 30

        tracker.on('query', (query) => {
            expect(query.method).toEqual('first')
            query.response([
                {
                    id: listItemId,
                    CreatedBy_id: userId,
                    List_id: listId,
                    is_resolved: false,
                },
            ])
        })

        const isListMember = sinon
            .stub(ListMembersLib.prototype, 'isListMember')
            .resolves(false)

        const listItems = new ListItemsLib()

        jest.spyOn(listItems, 'isListItemCreator').mockResolvedValue(false)

        return listItems
            .deleteItem(listItemId, userId)
            .catch((ex) => {
                expect(ex).toBeInstanceOf(ServerPermissionsError)
                expect(ex.message).toContain(
                    'User 30 is not a member of List 20',
                )
            })
            .finally(() => {
                isListMember.restore()
            })
    })

    it('will throw an error if the item was created by the user but they are not a member', () => {
        expect.assertions(3)

        const listItemId = 10
        const listId = 20
        const userId = 30

        tracker.on('query', (query) => {
            expect(query.method).toEqual('first')
            query.response([
                {
                    id: listItemId,
                    CreatedBy_id: userId,
                    List_id: listId,
                    is_resolved: false,
                },
            ])
        })

        const isListMember = sinon
            .stub(ListMembersLib.prototype, 'isListMember')
            .resolves(false)

        const listItems = new ListItemsLib()

        jest.spyOn(listItems, 'isListItemCreator').mockResolvedValue(true)

        return listItems
            .deleteItem(listItemId, userId)
            .catch((ex) => {
                expect(ex).toBeInstanceOf(ServerPermissionsError)
                expect(ex.message).toContain(
                    'User 30 is not a member of List 20',
                )
            })
            .finally(() => {
                isListMember.restore()
            })
    })

    it('will throw an error if the item does not exist', () => {
        expect.assertions(4)

        const listItemId = 10
        const userId = 30

        tracker.on('query', (query) => {
            expect(query.method).toEqual('first')
            query.response()
        })

        const listItems = new ListItemsLib()

        return listItems.deleteItem(listItemId, userId).catch((ex) => {
            expect(ex).toBeInstanceOf(ServerNotFoundError)
            expect(ex.message.toLowerCase()).toContain('list item')
            expect(ex.humanMessage.toLowerCase()).toContain('list item')
        })
    })

    it('will throw an error if the item has already been resolved', () => {
        expect.assertions(4)

        const listItemId = 10
        const listId = 20
        const userId = 30

        tracker.on('query', (query) => {
            expect(query.method).toEqual('first')
            query.response([
                {
                    id: listItemId,
                    CreatedBy_id: userId,
                    List_id: listId,
                    is_resolved: true,
                },
            ])
        })

        const listItems = new ListItemsLib()

        return listItems.deleteItem(listItemId, userId).catch((ex) => {
            expect(ex).toBeInstanceOf(ServerValidationError)
            expect(ex.message).toContain('List item has already been resolved')
            expect(ex.message).toContain('List item has already been resolved')
        })
    })
})

describe('changeItemPriority', () => {
    it('can change the item priority if it is not resolved, and the user is a member of the list', () => {
        expect.assertions(3)

        const listItemId = 10
        const listId = 20
        const userId = 30
        const priorityId = ListPrioritiesLib.NORMAL

        tracker.on('query', (query, step) => {
            return [
                () => {
                    expect(query.method).toEqual('first')
                    query.response([
                        {
                            id: listItemId,
                            List_id: listId,
                            Priority_id: ListPrioritiesLib.URGENT,
                            is_resolved: false,
                        },
                    ])
                },
                () => {
                    expect(query.method).toEqual('update')
                    query.response()
                },
            ][step - 1]()
        })

        const isListMember = sinon
            .stub(ListMembersLib.prototype, 'isListMember')
            .resolves(true)

        const listItems = new ListItemsLib()

        return listItems
            .changeItemPriority(listItemId, userId, priorityId)
            .then(() => {
                expect(isListMember.calledWith(listId, userId)).toEqual(true)
            })
            .finally(() => {
                isListMember.restore()
            })
    })

    it('will throw an error if the user is not a member of the list', () => {
        expect.assertions(2)

        const listItemId = 10
        const listId = 20
        const userId = 30
        const priorityId = ListPrioritiesLib.NORMAL

        tracker.on('query', (query) => {
            query.response([
                {
                    id: listItemId,
                    List_id: listId,
                    Priority_id: ListPrioritiesLib.URGENT,
                    is_resolved: false,
                },
            ])
        })

        const isListMember = sinon
            .stub(ListMembersLib.prototype, 'isListMember')
            .resolves(false)

        const listItems = new ListItemsLib()

        return listItems
            .changeItemPriority(listItemId, userId, priorityId)
            .catch((ex) => {
                expect(ex).toBeInstanceOf(ServerPermissionsError)
                expect(ex.message).toContain(
                    'User 30 is not a member of List 20',
                )
            })
            .finally(() => {
                isListMember.restore()
            })
    })

    it('will throw an error if the priority is not valid', () => {
        expect.assertions(3)

        const listItemId = 10
        const listId = 20
        const userId = 30
        const priorityId = 9999

        tracker.on('query', (query) => {
            query.response([
                {
                    id: listItemId,
                    List_id: listId,
                    Priority_id: ListPrioritiesLib.URGENT,
                    is_resolved: false,
                },
            ])
        })

        const isListMember = sinon
            .stub(ListMembersLib.prototype, 'isListMember')
            .resolves(true)

        const listItems = new ListItemsLib()

        return listItems
            .changeItemPriority(listItemId, userId, priorityId)
            .catch((ex) => {
                expect(ex).toBeInstanceOf(ServerValidationError)
                expect(ex.message).toContain('Invalid Priority Value')
                expect(ex.humanMessage).toContain('Invalid Priority Value')
            })
            .finally(() => {
                isListMember.restore()
            })
    })

    it('will throw an error if the new priority is the same as the old one', () => {
        expect.assertions(3)

        const listItemId = 10
        const listId = 20
        const userId = 30
        const priorityId = ListPrioritiesLib.URGENT

        tracker.on('query', (query) => {
            query.response([
                {
                    id: listItemId,
                    List_id: listId,
                    Priority_id: ListPrioritiesLib.URGENT,
                    is_resolved: false,
                },
            ])
        })

        const isListMember = sinon
            .stub(ListMembersLib.prototype, 'isListMember')
            .resolves(true)

        const listItems = new ListItemsLib()

        return listItems
            .changeItemPriority(listItemId, userId, priorityId)
            .catch((ex) => {
                expect(ex).toBeInstanceOf(ServerValidationError)
                expect(ex.message).toContain(
                    'New Priority can not be the same as Old Priority',
                )
                expect(ex.humanMessage).toContain(
                    'New Priority can not be the same as Old Priority',
                )
            })
            .finally(() => {
                isListMember.restore()
            })
    })

    it('will throw an error if the item is already resolved', () => {
        expect.assertions(3)

        const listItemId = 10
        const listId = 20
        const userId = 30
        const priorityId = ListPrioritiesLib.NORMAL

        tracker.on('query', (query) => {
            query.response([
                {
                    id: listItemId,
                    List_id: listId,
                    Priority_id: ListPrioritiesLib.URGENT,
                    is_resolved: true,
                },
            ])
        })

        const isListMember = sinon
            .stub(ListMembersLib.prototype, 'isListMember')
            .resolves(true)

        const listItems = new ListItemsLib()

        return listItems
            .changeItemPriority(listItemId, userId, priorityId)
            .catch((ex) => {
                expect(ex).toBeInstanceOf(ServerValidationError)
                expect(ex.message).toContain(
                    'Item Priority can not be changed after it is resolved',
                )
                expect(ex.humanMessage).toContain(
                    'Item Priority can not be changed after it is resolved',
                )
            })
            .finally(() => {
                isListMember.restore()
            })
    })

    it('will throw an error if the item does not exist', () => {
        expect.assertions(3)

        const listItemId = 10
        const userId = 30
        const priorityId = ListPrioritiesLib.NORMAL

        tracker.on('query', (query) => {
            query.response([])
        })

        const listItems = new ListItemsLib()

        return listItems
            .changeItemPriority(listItemId, userId, priorityId)
            .catch((ex) => {
                expect(ex).toBeInstanceOf(ServerNotFoundError)
                expect(ex.message.toLowerCase()).toContain('list item')
                expect(ex.humanMessage.toLowerCase()).toContain('list item')
            })
    })
})

describe('updateListItem', () => {
    it('can update the name, description and emoji of a list item', () => {
        expect.assertions(4)

        const listItemId = 10
        const listId = 20
        const userId = 30
        const payload = {
            name: 'test',
            description: 'test description',
            emoji: '🥑',
        }

        tracker.on('query', (query, step) => {
            return [
                () => {
                    expect(query.method).toEqual('first')
                    query.response([
                        {
                            id: listItemId,
                            List_id: listId,
                            CreatedBy_id: userId,
                        },
                    ])
                },
                () => {
                    expect(query.method).toEqual('update')
                    query.response()
                },
            ][step - 1]()
        })

        const isListMember = sinon
            .stub(ListMembersLib.prototype, 'isListMember')
            .resolves(true)

        const listItems = new ListItemsLib()

        const isListItemCreator = jest
            .spyOn(listItems, 'isListItemCreator')
            .mockResolvedValue(true)

        return listItems
            .updateListItem(listItemId, userId, payload)
            .then(() => {
                expect(isListMember.calledWith(listId, userId)).toEqual(true)
                expect(isListItemCreator).toBeCalledWith(listItemId, userId)
            })
            .finally(() => {
                isListMember.restore()
            })
    })

    it('will throw an error if the user is not a member of the list', () => {
        expect.assertions(2)

        const listItemId = 10
        const listId = 20
        const userId = 30
        const payload = {
            name: 'test',
            description: 'test description',
            emoji: '🥑',
        }

        tracker.on('query', (query) => {
            query.response([
                {
                    id: listItemId,
                    List_id: listId,
                    CreatedBy_id: userId,
                },
            ])
        })

        const isListMember = sinon
            .stub(ListMembersLib.prototype, 'isListMember')
            .resolves(false)

        const listItems = new ListItemsLib()

        return listItems
            .updateListItem(listItemId, userId, payload)
            .catch((ex) => {
                expect(ex).toBeInstanceOf(ServerPermissionsError)
                expect(ex.message).toContain(
                    'User ID 30 is not a member of List',
                )
            })
            .finally(() => {
                isListMember.restore()
            })
    })

    it('will throw an error if the item does not exist', () => {
        expect.assertions(3)

        const listItemId = 10
        const userId = 30
        const payload = {
            name: 'test',
            description: 'test description',
            emoji: '🥑',
        }

        tracker.on('query', (query) => {
            query.response([])
        })

        const listItems = new ListItemsLib()

        return listItems
            .updateListItem(listItemId, userId, payload)
            .catch((ex) => {
                expect(ex).toBeInstanceOf(ServerNotFoundError)
                expect(ex.message.toLowerCase()).toContain('list item')
                expect(ex.humanMessage.toLowerCase()).toContain('list item')
            })
    })

    it('will throw an error if an empty object is passed', () => {
        expect.assertions(1)

        const listItemId = 10
        const userId = 30
        const payload = {}

        const listItems = new ListItemsLib()

        return listItems
            .updateListItem(listItemId, userId, payload)
            .catch((ex) => {
                expect(ex).toBeInstanceOf(ServerValidationError)
            })
    })

    it('will throw an error if a user who did not create it updates the list item', () => {
        expect.assertions(2)

        const listItemId = 10
        const listId = 20
        const userId = 30
        const payload = {
            name: 'test',
            description: 'test description',
            emoji: '🥑',
        }

        tracker.on('query', (query) => {
            query.response([
                {
                    id: listItemId,
                    List_id: listId,
                    CreatedBy_id: 40,
                },
            ])
        })

        const isListMember = sinon
            .stub(ListMembersLib.prototype, 'isListMember')
            .resolves(true)

        const listItems = new ListItemsLib()

        jest.spyOn(listItems, 'isListItemCreator').mockResolvedValue(false)

        return listItems
            .updateListItem(listItemId, userId, payload)
            .catch((ex) => {
                expect(ex).toBeInstanceOf(ServerPermissionsError)
                expect(ex.message).toContain(
                    'User ID 30 did not create List Item 10',
                )
            })
            .finally(() => {
                isListMember.restore()
            })
    })

    it('will throw an error if there are unsupported options', () => {
        expect.assertions(1)

        const listItemId = 10
        const userId = 30
        const payload = {
            name: 'test',
            description: 'test description',
            emoji: '🥑',
            unsupportedOption: true,
        }

        const listItems = new ListItemsLib()

        return listItems
            .updateListItem(listItemId, userId, payload)
            .catch((ex) => {
                expect(ex).toBeInstanceOf(ServerValidationError)
            })
    })
})
