const { database } = require('../util/Database')

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
    async addMemberToList(listId, userId, addUserId) {
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
     * @param {*} listId List ID
     * @param {*} removeUserId User ID to Remove
     */
    async removeMemberForList(listId, userId, removeUserId) {
        const isListMember = await this.isListMember(listId, removeUserId)

        if (!isListMember) {
            return
        }

        await database('list_members')
            .where('List_id', listId)
            .where('User_id', removeUserId)
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
            .from('list_members')
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
