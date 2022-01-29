const sinon = require('sinon')
const { ListItemsLib } = require('../../lib/ListItems')
const { ListItemValidator } = require('../../middleware/ListItemValidator')
const {
    ServerPermissionsError,
    ServerNotFoundError,
} = require('../../util/ServerErrors')

describe('ListItemValidator Middleware', () => {
    const isListItemCreator = sinon.stub(
        ListItemsLib.prototype,
        'isListItemCreator',
    )
    const belongsToList = sinon.stub(ListItemsLib.prototype, 'belongsToList')

    let req
    let next

    beforeEach(() => {
        req = {
            get: jest.fn(),
        }

        next = jest.fn()
    })

    afterEach(() => {
        isListItemCreator.reset()
        belongsToList.reset()
    })

    it('will allow if item belongs to list', () => {
        expect.assertions(2)

        belongsToList.resolves(true)

        const listItemValidator = ListItemValidator()

        return listItemValidator(
            { ...req, user: { id: 20 }, params: { listId: 10, itemId: 20 } },
            {},
            next,
        ).then(() => {
            expect(next).toBeCalledWith()
            expect(next).toBeCalledTimes(1)
        })
    })

    it('will allow if belongs to list, user is owner, and option isCreator = true', () => {
        expect.assertions(2)

        belongsToList.resolves(true)
        isListItemCreator.resolves(true)

        const listItemValidator = ListItemValidator({
            isCreator: true,
        })

        return listItemValidator(
            { ...req, user: { id: 20 }, params: { listId: 10, itemId: 20 } },
            {},
            next,
        ).then(() => {
            expect(next).toBeCalledWith()
            expect(next).toBeCalledTimes(1)
        })
    })

    it('will return a Permissions Error if belongs to list, user is not owner, and option isCreator = true', () => {
        expect.assertions(1)

        belongsToList.resolves(true)
        isListItemCreator.resolves(false)

        const listItemValidator = ListItemValidator({
            isCreator: true,
        })

        return listItemValidator(
            { ...req, user: { id: 20 }, params: { listId: 10, itemId: 20 } },
            {},
            next,
        ).then(() => {
            expect(next.mock.calls[0][0]).toBeInstanceOf(ServerPermissionsError)
        })
    })

    it('will return a Permissions Error if not belongs to list', () => {
        expect.assertions(1)

        belongsToList.resolves(false)

        const listItemValidator = ListItemValidator()

        return listItemValidator(
            { ...req, user: { id: 20 }, params: { listId: 10, itemId: 20 } },
            {},
            next,
        ).then(() => {
            expect(next.mock.calls[0][0]).toBeInstanceOf(ServerNotFoundError)
        })
    })
})
