// eslint-disable-next-line no-unused-vars
const { Knex } = require('knex')

/**
 * Up migration
 *
 * @param {Knex<any, unknown>} knex
 */
function up(knex) {
    return knex.schema.alterTable('list_items', (table) => {
        table.dateTime('resolved_at')
    })
}

/**
 * Down migration
 *
 * @param {Knex<any, unknown>} knex
 */
function down(knex) {
    return knex.schema.alterTable('list_items', (table) => {
        table.dropColumn('resolved_at')
    })
}

module.exports = { up, down }
