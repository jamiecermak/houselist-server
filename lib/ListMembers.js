const { database } = require('../util/Database')
const { ListsLib } = require('./Lists')

class ListMembersLib {
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

    async addMemberToList(userId, listId, addUserId) {
        const lists = new ListsLib()
        const isListOwner = await lists.isListOwner(listId, userId)

        if (!isListOwner) {
            throw new Error(
                `Can not add User ${addUserId} to List ${listId} as User ${userId} is not the owner`,
            )
        }

        const isListMember = await this.isListMember(listId, addUserId)

        if (isListMember) {
            return
        }

        await database.insert({
            List_id: listId,
            User_id: addUserId,
            AddedBy_id: userId,
            created_at: new Date(),
        })
    }

    async removeMemberForList(userId, listId, removeUserId) {
        const lists = new ListsLib()
        const isListOwner = await lists.isListOwner(listId, userId)

        if (!isListOwner) {
            throw new Error(
                `Can not remove User ${removeUserId} from List ${listId} as User ${userId} is not the owner`,
            )
        }

        if (userId === removeUserId) {
            throw new Error('Can not remove the owner of a list')
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
