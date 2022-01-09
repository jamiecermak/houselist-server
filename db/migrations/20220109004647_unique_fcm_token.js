// eslint-disable-next-line no-unused-vars
const { Knex } = require('knex')

/**
 * Up migration
 *
 * @param {Knex<any, unknown>} knex
 */
function up(knex) {
    return knex.schema.alterTable('user_fcm_tokens', (table) => {
        table.unique('token', { indexName: 'unique_fcm_token' })
    })
}

/**
 * Down migration
 *
 * @param {Knex<any, unknown>} knex
 */
function down(knex) {
    return knex.schema.alterTable('user_fcm_tokens', (table) => {
        table.dropUnique('token', 'unique_fcm_token')
    })
}

module.exports = { up, down }
