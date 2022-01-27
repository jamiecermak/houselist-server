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

        const listMembers = new ListMembersLib()
        const users = new UsersLib()

        const memberList = await listMembers.getMembersOfList(listId)
        const populatedUsers = await users.getUsersByIds(memberList)

        const response = new SuccessResponse(populatedUsers)
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

        const listMembers = new ListMembersLib()

        const memberList = await listMembers.addMemberToList(
            req.user.id,
            listId,
            User_id,
        )

        const response = new SuccessResponse(memberList)
        response.send(res)
    }),
)

/**
 * DELETE /list/:listId/members/:userId
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

        const listMembers = new ListMembersLib()

        const memberList = await listMembers.removeMemberForList(
            req.user.id,
            listId,
            User_id,
        )

        const response = new SuccessResponse(memberList)
        response.send(res)
    }),
)

module.exports = {
    ListMemberRoutes: router,
}
