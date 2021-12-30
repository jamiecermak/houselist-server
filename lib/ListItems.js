const { database } = require('../util/Database')
const yup = require('yup')
const { ListPrioritiesLib } = require('./ListPriorities')
const { ListMembersLib } = require('./ListMembers')

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

    async addItemToList(listId, userId, payload) {
        let validPayload

        try {
            validPayload = ListItemsLib.addSchema.validateSync(payload, {
                strict: true,
                stripUnknown: true,
            })
        } catch (ex) {
            throw new Error('Invalid Payload')
        }

        const listMembers = new ListMembersLib()
        const isListMember = await listMembers.isListMember(listId, userId)

        if (!isListMember) {
            throw new Error(
                `Can not create list item as User ${userId} is not a member of List ${listId}`,
            )
        }

        validPayload.Priority_id = validPayload.priority
        delete validPayload.priority

        const listItem = await database
            .insert({
                List_id: listId,
                CreatedBy_id: userId,
                created_at: new Date(),
                UpdatedBy_id: null,
                updated_at: null,
                ...validPayload,
            })
            .into('list_items')
            .returning('id')

        return listItem[0].id
    }

    async resolveItem(listItemId, userId) {
        const item = await database
            .select('id', 'List_id', 'is_resolved')
            .from('list_items')
            .where('id', listItemId)
            .first()

        if (!item) {
            throw new Error('Item does not exist')
        }

        const listMembers = new ListMembersLib()
        const isListMember = await listMembers.isListMember(
            item.List_id,
            userId,
        )

        if (!isListMember) {
            throw new Error(
                `User ${userId} is not a member of List ${item.List_id}`,
            )
        }

        if (item.is_resolved) {
            throw new Error('Item has already been resolved')
        }

        await database('list_items').where('id', item.id).update({
            ResolvedBy_id: userId,
            resolved_at: new Date(),
            is_resolved: true,
        })
    }

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
}

module.exports = {
    ListItemsLib,
}
