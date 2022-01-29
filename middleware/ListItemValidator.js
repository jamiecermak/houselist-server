const yup = require('yup')
const { ListItemsLib } = require('../lib/ListItems')
const {
    ServerPermissionsError,
    ServerNotFoundError,
} = require('../util/ServerErrors')
const { PayloadValidator } = require('./PayloadValidator')

/**
 * Validate a List Item belongs to a List and User is optionally Creator
 */
function ListItemValidator(options = {}) {
    return async (req, res, next) => {
        const listIdValidator = PayloadValidator(
            yup.object().shape({
                listId: yup.number().required('List ID is required'),
                itemId: yup.number().required('List Item ID is required'),
            }),
            {
                path: 'params',
            },
        )

        return listIdValidator(req, res, async (ex) => {
            if (ex) return next(ex)

            const { listId, itemId } = req.payload.params

            const listItems = new ListItemsLib()

            const belongsToList = await listItems.belongsToList(itemId, listId)

            if (!belongsToList) {
                return next(new ServerNotFoundError(`list item`))
            }

            if (Object.keys(options).includes('isCreator')) {
                const isItemCreator = await listItems.isListItemCreator(
                    itemId,
                    req.user.id,
                )

                if (isItemCreator !== options.isCreator) {
                    return next(
                        new ServerPermissionsError(
                            `User ${req.user.id} does not match Item Creator status of ${options.isCreator}`,
                        ),
                    )
                }
            }

            next()
        })
    }
}

module.exports = { ListItemValidator }
