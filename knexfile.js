require('dotenv').config({
    path: `.env.${process.env.NODE_ENV}`,
})

const BASE_CONFIG = {
    client: 'pg',
    connection: process.env.HL_DB_CONNECTION_STRING,
    searchPath: ['knex', 'public'],
    pool: {
        min: 2,
        max: 10,
    },
    migrations: {
        stub: './db/migrations.stub.js',
        directory: './db/migrations',
        tableName: 'knex_migrations',
    },
}

const TEST_CONFIG = {
    ...BASE_CONFIG,
    connection: process.env.HL_TEST_DB_CONNECTION_STRING,
    seeds: {
        directory: './e2e/seeds',
    },
}

module.exports = {
    test: TEST_CONFIG,
    development: BASE_CONFIG,
    production: BASE_CONFIG,
}
