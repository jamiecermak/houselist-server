require('dotenv').config({
    path: `.env.${process.env.NODE_ENV}`,
})

module.exports = {
    development: {
        client: 'postgresql',
        connection: process.env.HL_DB_CONNECTION_STRING,
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            stub: './db/migrations.stub.js',
            directory: './db/migrations',
            tableName: 'knex_migrations',
        },
    },

    production: {
        client: 'postgresql',
        connection: process.env.HL_DB_CONNECTION_STRING,
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            stub: './db/migrations.stub.js',
            directory: './db/migrations',
            tableName: 'knex_migrations',
        },
    },
}
