// eslint-disable-next-line no-unused-vars
const { Knex } = require('knex')

/**
 * Up migration
 *
 * @param {Knex<any, unknown>} knex
 */
function up(knex) {
    return knex.schema.alterTable('list_members', (table) => {
        table.dateTime('created_at').defaultTo(knex.fn.now())
    })
}

/**
 * Down migration
 *
 * @param {Knex<any, unknown>} knex
 */
function down(knex) {
    return knex.schema.alterTable('list_members', (table) => {
        table.dropColumn('created_at')
    })
}

module.exports = { up, down }
