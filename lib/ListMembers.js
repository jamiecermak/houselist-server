const { database } = require('../util/Database')
const {
    ServerPermissionsError,
    ServerValidationError,
} = require('../util/ServerErrors')
const { ListsLib } = require('./Lists')

class ListMembersLib {
    /**
     * Check if a User is a Member of a List
     *
     * @param {number} listId
     * @param {number} userId
     * @returns {boolean}
     */
    async isListMember(listId, userId) {
        const member = await database
            .select(
                'list_members.id',
                'list_members.List_id',
                'list_members.User_id',
            )
            .from('list_members')
            .innerJoin('users', 'list_members.User_id', 'users.id')
            .where('list_members.List_id', listId)
            .where('users.id', userId)
            .where('users.is_active', 1)
            .first()

        if (!member) {
            return false
        }

        return true
    }

    /**
     * Add a new User to a List
     *
     * @param {number} userId
     * @param {number} listId
     * @param {number} addUserId
     */
    async addMemberToList(userId, listId, addUserId) {
        const lists = new ListsLib()
        const isListOwner = await lists.isListOwner(listId, userId)

        if (!isListOwner) {
            throw new ServerPermissionsError(
                `Can not add User ${addUserId} to List ${listId} as User ${userId} is not the owner`,
            )
        }

        const isListMember = await this.isListMember(listId, addUserId)

        if (isListMember) {
            return
        }

        await database('list_members').insert({
            List_id: listId,
            User_id: addUserId,
            AddedBy_id: userId,
        })
    }

    /**
     * Remove a Member from a List
     *
     * @param {*} userId Current User ID
     * @param {*} listId List ID
     * @param {*} removeUserId User ID to Remove
     */
    async removeMemberForList(userId, listId, removeUserId) {
        const lists = new ListsLib()
        const isListOwner = await lists.isListOwner(listId, userId)

        if (!isListOwner) {
            throw new ServerPermissionsError(
                `Can not remove User ${removeUserId} from List ${listId} as User ${userId} is not the owner`,
            )
        }

        if (userId === removeUserId) {
            throw new ServerValidationError(
                'Can not remove the owner of a list',
                'Can not remove the owner of a list',
            )
        }

        const isListMember = await this.isListMember(listId, removeUserId)

        if (!isListMember) {
            return
        }

        await database('list_members')
            .where('List_id', listId)
            .where('User_id', userId)
            .del()
    }

    /**
     * Get all Member of a List, excluding some User IDs if required
     *
     * @param {number} listId List ID
     * @param {Array<number>} excludeUserIds User IDs to Exclude
     * @returns {Array<number>} List Members
     */
    async getMembersOfList(listId, excludeUserIds = []) {
        const query = database
            .select(
                'list_members.id',
                'list_members.List_id',
                'list_members.User_id',
            )
            .innerJoin('users', 'list_members.User_id', 'users.id')
            .where('list_members.List_id', listId)
            .where('users.is_active', 1)

        let members

        if (excludeUserIds.length === 0) {
            members = await query.clone()
        } else {
            members = await query
                .clone()
                .whereNotIn('list_members.User_id', excludeUserIds)
        }

        return members.map((member) => member.User_id)
    }
}

module.exports = { ListMembersLib }
