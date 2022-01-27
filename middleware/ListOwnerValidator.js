const yup = require('yup')
const { ListsLib } = require('../lib/Lists')
const { ServerPermissionsError } = require('../util/ServerErrors')
const { PayloadValidator } = require('./PayloadValidator')

/**
 * Validate a User is the Owner of the current list
 */
function ListOwnerValidator() {
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

            const lists = new ListsLib()

            const isListOwner = await lists.isListOwner(listId, req.user.id)

            if (!isListOwner) {
                return next(
                    new ServerPermissionsError(
                        `User ${req.user.id} is not the owner of List ${listId}`,
                    ),
                )
            }

            next()
        })
    }
}

module.exports = { ListOwnerValidator }
