const { database } = require('../util/Database')
const yup = require('yup')
const {
    ServerPermissionsError,
    ServerValidationError,
} = require('../util/ServerErrors')

class ListsLib {
    static updateSchema = yup
        .object()
        .shape({
            name: yup.string(),
            description: yup.string(),
            emoji: yup.string(),
        })
        .noUnknown(true)

    async getListsForUser(userId) {
        const lists = await database
            .select(
                'lists.id',
                'lists.name',
                'lists.description',
                'lists.emoji',
            )
            .from('lists')
            .innerJoin('list_members', function () {
                this.on('lists.id', '=', 'list_members.List_id').andOn(
                    'list_members.User_id',
                    '=',
                    userId,
                )
            })

        return lists
    }

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
                UpdatedBy_id: userId,
            })
            .into('lists')
            .returning('id')

        if (list.length === 0) {
            throw new ServerValidationError(
                `Could not create list for User ID ${userId}`,
                'Could not create list',
            )
        }

        const listId = list[0]

        return listId
    }

    async deleteList(userId, listId) {
        const isListOwner = await this.isListOwner(listId, userId)

        if (!isListOwner) {
            throw new ServerPermissionsError(
                `Can not delete List ${listId} as User ${userId} did not create it`,
            )
        }

        await database('lists').where('id', listId).del()
    }

    async updateList(userId, listId, updateOptions) {
        // Ensure that updateOptions is valid
        let validOptions

        try {
            validOptions = ListsLib.updateSchema.validateSync(updateOptions, {
                strict: true,
                stripUnknown: true,
            })
        } catch (ex) {
            throw new ServerValidationError()
        }

        // Ensure that validOptions is not empty
        if (Object.keys(validOptions).length === 0) {
            throw new ServerValidationError()
        }

        // Ensure that the userId is the owner of listId
        const isListOwner = await this.isListOwner(listId, userId)

        if (!isListOwner) {
            throw new ServerPermissionsError(
                `Can not modify List ${listId} as User ${userId} did not create it`,
            )
        }

        // Update the list record
        await database('lists')
            .where('id', listId)
            .where('CreatedBy_id', userId)
            .update(validOptions)
    }

    async isListOwner(listId, userId) {
        const list = await database
            .select('id', 'CreatedBy_id')
            .from('lists')
            .where('id', listId)
            .where('CreatedBy_id', userId)
            .first()

        if (!list) {
            return false
        }

        return true
    }
}

module.exports = { ListsLib }
