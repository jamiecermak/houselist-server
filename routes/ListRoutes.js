const { SuccessResponse } = require('../util/APIResponses')
const { ErrorHandler } = require('../middleware/ErrorHandler')
const { IsAuthorised } = require('../middleware/IsAuthorised')
const { PayloadValidator } = require('../middleware/PayloadValidator')
const yup = require('yup')
const { ListsLib } = require('../lib/Lists')
const { ListMembersLib } = require('../lib/ListMembers')
const { ListMemberValidator } = require('../middleware/ListMemberValidator')
const router = require('express').Router()

/**
 * GET /list
 *
 * Get all lists assigned to the authenticated user
 */
router.get(
    '',
    IsAuthorised,
    ErrorHandler(async (req, res) => {
        const lists = new ListsLib()

        const userLists = await lists.getListsForUser(req.user.id)

        const response = new SuccessResponse(userLists)
        response.send(res)
    }),
)

/**
 * POST /list
 *
 * Create a new list
 */
router.post(
    '',
    IsAuthorised,
    PayloadValidator(
        yup
            .object()
            .shape({
                name: yup
                    .string()
                    .max(255, 'List name must be less than 255 characters')
                    .required('List name is required'),
                description: yup
                    .string()
                    .max(
                        255,
                        'List description must be less than 255 characters',
                    )
                    .default(''),
                emoji: yup.string().default('🛒'),
            })
            .noUnknown(true, 'Unknown options')
            .strict(true),
    ),
    ErrorHandler(async (req, res) => {
        const { name, description, emoji } = req.payload.body

        const lists = new ListsLib()

        const listId = await lists.createList(
            req.user.id,
            name,
            description,
            emoji,
        )

        const listMembers = new ListMembersLib()
        await listMembers.addMemberToList(listId, req.user.id, req.user.id)

        const response = new SuccessResponse({ id: listId })
        response.send(res)
    }),
)

/**
 * GET /list/:listId
 *
 * Get information about a list
 */
router.get(
    '/:listId',
    IsAuthorised,
    ListMemberValidator(),
    ErrorHandler(async (req, res) => {
        const { listId } = req.payload.params

        const lists = new ListsLib()

        const listData = await lists.getList(listId)

        const response = new SuccessResponse(listData)
        response.send(res)
    }),
)

module.exports = {
    ListRoutes: router,
}
