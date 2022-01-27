const yup = require('yup')
const { ListMembersLib } = require('../lib/ListMembers')
const { ServerPermissionsError } = require('../util/ServerErrors')
const { PayloadValidator } = require('./PayloadValidator')

/**
 * Validate a User is a Member of the current list
 */
function ListMemberValidator() {
    return async (req, res, next) => {
        const listIdValidator = PayloadValidator(
            yup.object().shape({
                listId: yup.number().required('List ID is required'),
            }),
            {
                path: 'params',
            },
        )

        listIdValidator(req, res, async (ex) => {
            if (ex) return next(ex)

            const listId = req.payload.params.listId

            const listMembers = new ListMembersLib()

            const isListMember = await listMembers.isListMember(
                listId,
                req.user.id,
            )

            if (!isListMember) {
                return next(
                    new ServerPermissionsError(
                        `User ${req.user.id} is not a member of List ${listId}`,
                    ),
                )
            }

            next()
        })
    }
}

module.exports = { ListMemberValidator }
