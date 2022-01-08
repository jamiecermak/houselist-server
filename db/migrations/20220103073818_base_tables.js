// eslint-disable-next-line no-unused-vars
const { Knex } = require('knex')

/**
 * Up migration
 *
 * @param {Knex<any, unknown>} knex
 */
function up(knex) {
    return knex.schema
        .createTable('users', (table) => {
            table.increments('id', { primaryKey: true })
            table
                .string('email_address', 255)
                .notNullable()
                .index('users_email_index')
            table.string('name', 255).notNullable()
            table.string('username', 255).notNullable()
            table.string('password', 255).notNullable()
            table.boolean('is_active').defaultTo(true)
            table.string('profile_image_bucket', 255).nullable().defaultTo(null)
            table.string('profile_image_key').nullable().defaultTo(null)
            table.dateTime('created_at').defaultTo(knex.fn.now())
            table.dateTime('updated_at').defaultTo(knex.fn.now())
        })
        .createTable('lists', (table) => {
            table.increments('id', { primaryKey: true })
            table.string('name', 255).notNullable()
            table.string('description', 255).notNullable().defaultTo('')
            table.string('emoji', 255).notNullable().defaultTo('')
            table.dateTime('created_at').defaultTo(knex.fn.now())
            table.dateTime('updated_at').defaultTo(knex.fn.now())
            table.integer('CreatedBy_id').notNullable()
            table.integer('UpdatedBy_id').notNullable()

            table
                .foreign('CreatedBy_id')
                .references('users.id')
                .onDelete('CASCADE')

            table
                .foreign('UpdatedBy_id')
                .references('users.id')
                .onDelete('NO ACTION')
        })
        .createTable('list_members', (table) => {
            table.increments('id', { primaryKey: true })
            table.integer('User_id').notNullable()
            table.integer('AddedBy_id').notNullable()
            table.integer('List_id').notNullable()

            table
                .foreign('AddedBy_id')
                .references('users.id')
                .onDelete('NO ACTION')

            table.foreign('User_id').references('users.id').onDelete('CASCADE')
            table.foreign('List_id').references('lists.id').onDelete('CASCADE')
        })
        .createTable('list_items', (table) => {
            table.increments('id', { primaryKey: true })
            table.integer('List_id')
            table.string('name', 255).notNullable()
            table.string('description', 255).notNullable().defaultTo('')
            table.string('emoji', 255).notNullable().defaultTo('')
            table.dateTime('created_at').defaultTo(knex.fn.now())
            table.dateTime('updated_at').defaultTo(knex.fn.now())
            table.integer('CreatedBy_id').notNullable()
            table.integer('UpdatedBy_id').notNullable()
            table.boolean('is_resolved').defaultTo(false)
            table.integer('Priority_id').notNullable()

            table.foreign('List_id').references('lists.id').onDelete('CASCADE')

            table
                .foreign('CreatedBy_id')
                .references('users.id')
                .onDelete('NO ACTION')

            table
                .foreign('UpdatedBy_id')
                .references('users.id')
                .onDelete('NO ACTION')
        })
        .createTable('user_fcm_tokens', (table) => {
            table.increments('id', { primaryKey: true })
            table.integer('User_id')
            table.string('token', 500).notNullable()
            table.boolean('is_active').defaultTo(true)

            table.foreign('User_id').references('users.id').onDelete('CASCADE')
        })
        .createTable('password_reset_tokens', (table) => {
            table.increments('id', { primaryKey: true })
            table.integer('User_id')
            table.string('token', 500).notNullable()
            table.boolean('is_used').defaultTo(false)
            table.string('used_by').nullable().defaultTo(null)
            table.dateTime('used_at').nullable().defaultTo(null)
            table.dateTime('created_at').defaultTo(knex.fn.now())

            table.foreign('User_id').references('users.id').onDelete('CASCADE')
        })
}

/**
 * Down migration
 *
 * @param {Knex<any, unknown>} knex
 */
function down(knex) {
    return knex.schema
        .dropTable('password_reset_tokens')
        .dropTable('user_fcm_tokens')
        .dropTable('list_items')
        .dropTable('list_members')
        .dropTable('lists')
        .dropTable('users')
}

module.exports = { up, down }
