const { SuccessResponse } = require('../util/APIResponses')
const { ErrorHandler } = require('../middleware/ErrorHandler')
const { IsAuthorised } = require('../middleware/IsAuthorised')
const { PayloadValidator } = require('../middleware/PayloadValidator')
const yup = require('yup')
const { ListsLib } = require('../lib/Lists')
const { ListMembersLib } = require('../lib/ListMembers')
const router = require('express').Router()

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
        await listMembers.addMemberToList(req.user.id, listId, req.user.id)

        const response = new SuccessResponse({ id: listId })
        response.send(res)
    }),
)

module.exports = {
    ListRoutes: router,
}
