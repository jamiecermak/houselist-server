const { database } = require('../util/Database')
const yup = require('yup')
const { ListPrioritiesLib } = require('./ListPriorities')
const { ListMembersLib } = require('./ListMembers')
const {
    ServerPermissionsError,
    ServerValidationError,
    ServerNotFoundError,
} = require('../util/ServerErrors')

class ListItemsLib {
    static addSchema = yup
        .object()
        .shape({
            name: yup.string().required(),
            description: yup.string().default(''),
            emoji: yup.string().default(''),
            priority: yup.number().default(ListPrioritiesLib.NORMAL),
        })
        .noUnknown(true)

    static updateSchema = yup
        .object()
        .shape({
            name: yup.string(),
            description: yup.string(),
            emoji: yup.string(),
        })
        .noUnknown(true)

    /**
     * Get all items in a list
     *
     * @param {number} listId List ID
     * @param {boolean} options Search options
     */
    async getItems(listId, options = {}) {
        const selectColumns = [
            'id',
            'name',
            'description',
            'emoji',
            'is_resolved',
            'Priority_id',
            'created_at',
            'updated_at',
            'resolved_at',
            'CreatedBy_id',
            'UpdatedBy_id',
            'ResolvedBy_id',
        ]

        const items = await database
            .select(selectColumns)
            .from('list_items')
            .where('List_id', listId)
            .where((builder) => {
                if (!Object.keys(options).includes('resolved')) {
                    return builder
                }

                return builder.where('is_resolved', options.resolved)
            })

        return items
    }

    /**
     * Add a new Item to a List
     *
     * @param {number} listId List ID
     * @param {number} userId User ID
     * @param {object} payload Item Payload
     * @returns {number} New List Item ID
     */
    async addItemToList(listId, userId, payload) {
        let validPayload

        try {
            validPayload = ListItemsLib.addSchema.validateSync(payload, {
                strict: true,
                stripUnknown: true,
            })
        } catch (ex) {
            throw new ServerValidationError()
        }

        validPayload.Priority_id = validPayload.priority
        delete validPayload.priority

        const listItem = await database
            .insert({
                List_id: listId,
                CreatedBy_id: userId,
                created_at: new Date(),
                UpdatedBy_id: userId,
                updated_at: new Date(),
                ...validPayload,
            })
            .into('list_items')
            .returning('id')

        return listItem[0]
    }

    /**
     * Set an Item as Resolved
     *
     * @param {number} listItemId List Item ID to Resolve
     * @param {number} userId Current User ID
     */
    async resolveItem(listItemId, userId) {
        const item = await database
            .select('id', 'List_id', 'is_resolved')
            .from('list_items')
            .where('id', listItemId)
            .first()

        if (!item) {
            throw new ServerNotFoundError('list item')
        }

        if (item.is_resolved) {
            throw new ServerValidationError(
                'Item has already been resolved',
                'Item has already been resolved',
            )
        }

        await database('list_items').where('id', item.id).update({
            ResolvedBy_id: userId,
            resolved_at: new Date(),
            is_resolved: true,
        })
    }

    /**
     * Delete an Item
     *
     * @param {number} listItemId List Item ID to Delete
     * @param {number} userId Current User ID
     */
    async deleteItem(listItemId, userId) {
        const listItem = await database
            .select('id', 'List_id', 'CreatedBy_id', 'is_resolved')
            .from('list_items')
            .where('id', listItemId)
            .first()

        if (!listItem) {
            throw new ServerNotFoundError('list item')
        }

        if (listItem.is_resolved) {
            throw new ServerValidationError(
                'List item has already been resolved',
                'List item has already been resolved',
            )
        }

        await database('list_items').where('id', listItemId).del()
    }

    /**
     * Change an Items priority
     *
     * @param {number} listItemId List Item ID to Update
     * @param {number} userId Current User ID
     * @param {number} newPriorityId New Priority ID to Assign
     */
    async changeItemPriority(listItemId, userId, newPriorityId) {
        if (!ListPrioritiesLib.getPriorities().includes(newPriorityId)) {
            throw new ServerValidationError(
                'Invalid Priority Value',
                'Invalid Priority Value',
            )
        }

        const listItem = await database
            .select('id', 'List_id', 'is_resolved', 'Priority_id')
            .from('list_items')
            .where('id', listItemId)
            .first()

        if (!listItem) {
            throw new ServerNotFoundError('list item')
        }

        if (listItem.is_resolved) {
            throw new ServerValidationError(
                'Item Priority can not be changed after it is resolved',
                'Item Priority can not be changed after it is resolved',
            )
        }

        if (listItem.Priority_id === newPriorityId) {
            throw new ServerValidationError(
                'New Priority can not be the same as Old Priority',
                'New Priority can not be the same as Old Priority',
            )
        }

        await database('list_items').where('id', listItemId).update({
            Priority_id: newPriorityId,
            UpdatedBy_id: userId,
            updated_at: database.fn.now(),
        })
    }

    /**
     * Update a Item with a new Name, Description or Emoji
     * if the User Created it
     *
     * @param {number} listItemId List Item ID to Update
     * @param {number} userId Current User ID
     * @param {object} payload Update Payload
     */
    async updateListItem(listItemId, userId, payload) {
        let validPayload

        try {
            validPayload = ListItemsLib.updateSchema.validateSync(payload, {
                strict: true,
                stripUnknown: true,
            })
        } catch (ex) {
            throw new ServerValidationError()
        }

        if (Object.keys(validPayload).length === 0) {
            throw new ServerValidationError()
        }

        const listItem = await database
            .select('id', 'List_id', 'CreatedBy_id')
            .from('list_items')
            .where('id', listItemId)
            .first()

        if (!listItem) {
            throw new ServerNotFoundError('list item')
        }

        const listMembers = new ListMembersLib()
        const isListMember = await listMembers.isListMember(
            listItem.List_id,
            userId,
        )

        if (!isListMember) {
            throw new ServerPermissionsError(
                `User ID ${userId} is not a member of List`,
            )
        }

        const isListItemCreator = await this.isListItemCreator(
            listItemId,
            userId,
        )

        if (!isListItemCreator) {
            throw new ServerPermissionsError(
                `User ID ${userId} did not create List Item ${listItemId}`,
            )
        }

        await database('list_items')
            .where('id', listItemId)
            .update(validPayload)
    }

    /**
     * Check if a User created a List Item
     *
     * @param {number} listItemId
     * @param {number} userId
     * @returns {boolean}
     */
    async isListItemCreator(listItemId, userId) {
        const listItem = await database
            .select('id')
            .from('list_items')
            .where('id', listItemId)
            .where('CreatedBy_id', userId)
            .first()

        if (!listItem) {
            return false
        }

        return true
    }

    /**
     * Determine if a list item belongs to a list
     *
     * @param {number} listItemId List Item ID
     * @param {number} listId List ID
     * @returns
     */
    async belongsToList(listItemId, listId) {
        const listItem = await database
            .select('id')
            .from('list_items')
            .where('id', listItemId)
            .where('List_id', listId)
            .first()

        if (!listItem) {
            return false
        }

        return true
    }
}

module.exports = {
    ListItemsLib,
}
