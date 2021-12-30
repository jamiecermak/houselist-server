const { database } = require('../util/Database')

class ListsLib {
    /**
     * Create a list for a user
     *
     * @param {number} userId User ID
     * @param {string} listName List Name
     * @param {string} listDescription List Description
     * @param {string} listEmoji List Emoji
     * @returns {number} New List ID
     */
    async createList(userId, listName, listDescription, listEmoji = null) {
        let emoji = listEmoji

        if (emoji === null) {
            emoji = '🛒'
        }

        const list = await database
            .insert({
                name: listName,
                description: listDescription,
                emoji,
                CreatedBy_id: userId,
                created_at: new Date(),
                updated_at: new Date(),
                UpdateBy_id: userId,
            })
            .into('lists')
            .returning('id')

        if (list.length === 0) {
            throw new Error(`Could not create list for User ID ${userId}`)
        }

        return list[0].id
    }

    async deleteList(userId, listId) {
        const list = await database
            .select('id', 'CreatedBy_id')
            .from('lists')
            .where('id', listId)
            .first()

        if (userId !== list.CreatedBy_id) {
            throw new Error(
                `Can not delete List ${listId} as User ${userId} did not create it`,
            )
        }

        await database('lists').where('id', listId).del()
    }
}

module.exports = { ListsLib }
