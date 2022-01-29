const { SuccessResponse } = require('../../util/APIResponses')
const { ErrorHandler } = require('../../middleware/ErrorHandler')
const { IsAuthorised } = require('../../middleware/IsAuthorised')
const { ListItemsLib } = require('../../lib/ListItems')
const { ListMemberValidator } = require('../../middleware/ListMemberValidator')
const { PayloadValidator } = require('../../middleware/PayloadValidator')
const router = require('express').Router()
const yup = require('yup')

const listItems = new ListItemsLib()

/**
 * GET /list/:listId/items/:itemId/resolve
 *
 * Resolve an item in a list
 */
router.get(
    '/:listId/items',
    IsAuthorised,
    PayloadValidator(
        yup.object().shape({
            resolved: yup.boolean(),
        }),
        {
            path: 'query',
        },
    ),
    ListMemberValidator(),
    ErrorHandler(async (req, res) => {
        const queryParams = req.payload.query
        const { listId } = req.payload.params

        const options = {}

        if (Object.keys(queryParams).includes('resolved')) {
            options.resolved = queryParams.resolved
        }

        const items = await listItems.getItems(listId, options)

        const response = new SuccessResponse(items)
        response.send(res)
    }),
)

module.exports = {
    GetListItemRoutes: router,
}
