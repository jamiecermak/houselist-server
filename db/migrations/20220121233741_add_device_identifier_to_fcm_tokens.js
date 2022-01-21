// eslint-disable-next-line no-unused-vars
const { Knex } = require('knex')

/**
 * Up migration
 *
 * @param {Knex<any, unknown>} knex
 */
function up(knex) {
    return knex.schema.alterTable('user_fcm_tokens', (table) => {
        table.string('device_id').notNullable()
        table.string('device_name').notNullable()
    })
}

/**
 * Down migration
 *
 * @param {Knex<any, unknown>} knex
 */
function down(knex) {
    return knex.schema.alterTable('user_fcm_tokens', (table) => {
        table.dropColumn('device_id')
        table.dropColumn('device_name')
    })
}

module.exports = { up, down }
