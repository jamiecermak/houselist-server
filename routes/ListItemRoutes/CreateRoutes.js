const { SuccessResponse } = require('../../util/APIResponses')
const { ErrorHandler } = require('../../middleware/ErrorHandler')
const { IsAuthorised } = require('../../middleware/IsAuthorised')
const { PayloadValidator } = require('../../middleware/PayloadValidator')
const { ListItemsLib } = require('../../lib/ListItems')
const { ListMemberValidator } = require('../../middleware/ListMemberValidator')
const router = require('express').Router()

const listItems = new ListItemsLib()

/**
 * POST /list/:listId/items
 *
 * Create a new item in a list
 */
router.post(
    '/:listId/items',
    IsAuthorised,
    PayloadValidator(ListItemsLib.addSchema),
    ListMemberValidator(),
    ErrorHandler(async (req, res) => {
        const { listId } = req.payload.params
        const body = req.payload.body

        const itemId = await listItems.addItemToList(listId, req.user.id, body)

        const response = new SuccessResponse({ id: itemId })
        response.send(res)
    }),
)

module.exports = {
    CreateListItemRoutes: router,
}
