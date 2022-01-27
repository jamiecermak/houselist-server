const sinon = require('sinon')
const { ListsLib } = require('../../lib/Lists')
const { ListOwnerValidator } = require('../../middleware/ListOwnerValidator')
const { ServerPermissionsError } = require('../../util/ServerErrors')

describe('ListOwnerValidator Middleware', () => {
    let req
    let next

    beforeEach(() => {
        req = {
            get: jest.fn(),
        }

        next = jest.fn()
    })

    it('will allow a list member', () => {
        expect.assertions(2)

        const isListOwner = sinon
            .stub(ListsLib.prototype, 'isListOwner')
            .resolves(true)

        const listOwnerValidator = ListOwnerValidator()

        return listOwnerValidator(
            { ...req, user: { id: 20 }, params: { listId: 10 } },
            {},
            next,
        )
            .then(() => {
                expect(next).toBeCalledWith()
                expect(next).toBeCalledTimes(1)
            })
            .finally(() => {
                isListOwner.restore()
            })
    })

    it('will return a Permissions Error if not a list member', () => {
        expect.assertions(1)

        const isListOwner = sinon
            .stub(ListsLib.prototype, 'isListOwner')
            .resolves(false)

        const listOwnerValidator = ListOwnerValidator()

        return listOwnerValidator(
            { ...req, user: { id: 20 }, params: { listId: 10 } },
            {},
            next,
        )
            .then(() => {
                expect(next.mock.calls[0][0]).toBeInstanceOf(
                    ServerPermissionsError,
                )
            })
            .finally(() => {
                isListOwner.restore()
            })
    })
})
