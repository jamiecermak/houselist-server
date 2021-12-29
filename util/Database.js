const { default: knex } = require('knex')
const { HL_DB_CONNECTION_STRING } = require('./Secrets')

const database = knex({
    client: 'pg',
    connection: HL_DB_CONNECTION_STRING,
    searchPath: ['knex', 'public'],
})

module.exports = { database }
