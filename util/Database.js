const { default: knex } = require('knex')
const knexfile = require('../knexfile')

function getConfig() {
    switch (process.env.NODE_ENV) {
        case 'test':
            return knexfile.test
        case 'development':
            return knexfile.development
        case 'production':
            return knexfile.production
        default:
            throw new Error('Invalid Environment for Knex Config')
    }
}

const database = knex(getConfig())

module.exports = { database }
