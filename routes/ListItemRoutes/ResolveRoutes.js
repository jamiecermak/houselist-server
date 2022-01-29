const { SuccessResponse } = require('../../util/APIResponses')
const { ErrorHandler } = require('../../middleware/ErrorHandler')
const { IsAuthorised } = require('../../middleware/IsAuthorised')
const { ListItemsLib } = require('../../lib/ListItems')
const { ListMemberValidator } = require('../../middleware/ListMemberValidator')
const { ListItemValidator } = require('../../middleware/ListItemValidator')
const router = require('express').Router()

const listItems = new ListItemsLib()

/**
 * GET /list/:listId/items/:itemId/resolve
 *
 * Resolve an item in a list
 */
router.get(
    '/:listId/items/:itemId/resolve',
    IsAuthorised,
    ListMemberValidator(),
    ListItemValidator(),
    ErrorHandler(async (req, res) => {
        const { itemId } = req.payload.params

        await listItems.resolveItem(itemId, req.user.id)

        const response = new SuccessResponse()
        response.send(res)
    }),
)

module.exports = {
    ResolveListItemRoutes: router,
}
