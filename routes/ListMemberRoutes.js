const { SuccessResponse } = require('../util/APIResponses')
const { ErrorHandler } = require('../middleware/ErrorHandler')
const { IsAuthorised } = require('../middleware/IsAuthorised')
const { PayloadValidator } = require('../middleware/PayloadValidator')
const yup = require('yup')
const { ListMembersLib } = require('../lib/ListMembers')
const { ListMemberValidator } = require('../middleware/ListMemberValidator')
const { ListOwnerValidator } = require('../middleware/ListOwnerValidator')
const { UsersLib } = require('../lib/Users')
const router = require('express').Router()

const listMembers = new ListMembersLib()
const users = new UsersLib()

async function getPopulatedMembers(listId) {
    const memberList = await listMembers.getMembersOfList(listId)
    const populatedUsers = await users.getUsersByIds(memberList)

    return populatedUsers
}

/**
 * GET /list/:listId/members
 *
 * Get all members assigned to a list
 */
router.get(
    '/:listId/members',
    IsAuthorised,
    ListMemberValidator(),
    ErrorHandler(async (req, res) => {
        const { listId } = req.payload.params

        const memberList = await getPopulatedMembers(listId)

        const response = new SuccessResponse(memberList)
        response.send(res)
    }),
)

/**
 * POST /list/:listId/members
 *
 * Add a new member to the list
 */
router.post(
    '/:listId/members',
    IsAuthorised,
    PayloadValidator(
        yup
            .object()
            .shape({
                User_id: yup.number().required('User_id is required'),
            })
            .noUnknown(true, 'Unknown options'),
    ),
    ListOwnerValidator(),
    ErrorHandler(async (req, res) => {
        const { listId } = req.payload.params
        const { User_id } = req.payload.body

        await listMembers.addMemberToList(listId, req.user.id, User_id)

        const memberList = await getPopulatedMembers(listId)

        const response = new SuccessResponse(memberList)
        response.send(res)
    }),
)

/**
 * DELETE /list/:listId/members/:userId
 *
 * Add a new member to the list
 */
router.delete(
    '/:listId/members/:userId',
    IsAuthorised,
    PayloadValidator(
        yup.object().shape({
            userId: yup.number().required('User ID is required'),
        }),
        {
            path: 'params',
        },
    ),
    ListOwnerValidator(),
    ErrorHandler(async (req, res) => {
        const { listId, userId } = req.payload.params

        await listMembers.removeMemberForList(listId, req.user.id, userId)

        const memberList = await getPopulatedMembers(listId)

        const response = new SuccessResponse(memberList)
        response.send(res)
    }),
)

module.exports = {
    ListMemberRoutes: router,
}
