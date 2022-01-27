const sinon = require('sinon')
const { ListMembersLib } = require('../../lib/ListMembers')
const { ListMemberValidator } = require('../../middleware/ListMemberValidator')
const { ServerPermissionsError } = require('../../util/ServerErrors')

describe('ListMemberValidator Middleware', () => {
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

        const isListMember = sinon
            .stub(ListMembersLib.prototype, 'isListMember')
            .resolves(true)

        const listMemberValidator = ListMemberValidator()

        return listMemberValidator(
            { ...req, user: { id: 20 }, params: { listId: 10 } },
            {},
            next,
        )
            .then(() => {
                expect(next).toBeCalledWith()
                expect(next).toBeCalledTimes(1)
            })
            .finally(() => {
                isListMember.restore()
            })
    })

    it('will return a Permissions Error if not a list member', () => {
        expect.assertions(1)

        const isListMember = sinon
            .stub(ListMembersLib.prototype, 'isListMember')
            .resolves(false)

        const listMemberValidator = ListMemberValidator()

        return listMemberValidator(
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
                isListMember.restore()
            })
    })
})
