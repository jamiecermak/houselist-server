const { default: knex } = require('knex')

const database = knex({
    client: 'pg',
    connection: process.env.DB_CONNECTION_STRING,
    searchPath: ['knex', 'public'],
})

module.exports = { database }
