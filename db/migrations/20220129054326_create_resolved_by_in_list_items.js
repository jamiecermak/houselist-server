// eslint-disable-next-line no-unused-vars
const { Knex } = require('knex')

/**
 * Up migration
 *
 * @param {Knex<any, unknown>} knex
 */
function up(knex) {
    return knex.schema.alterTable('list_items', (table) => {
        table.integer('ResolvedBy_id')

        table
            .foreign('ResolvedBy_id')
            .references('users.id')
            .onDelete('NO ACTION')
    })
}

/**
 * Down migration
 *
 * @param {Knex<any, unknown>} knex
 */
function down(knex) {
    return knex.schema.alterTable('list_items', (table) => {
        table.dropForeign('ResolvedBy_id')
    })
}

module.exports = { up, down }
