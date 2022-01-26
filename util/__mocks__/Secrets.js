module.exports = {
    HL_JWT_SECRET: 'jwt-secret',
    HL_JWT_EXPIRY: '1d',
    HL_DB_CONNECTION_STRING: 'db-connection-string',
    HL_FIREBASE_PROJECT_ID: 'firebase-project-id',
    HL_FIREBASE_CLIENT_EMAIL: 'firebase-client-email',
    HL_FIREBASE_PRIVATE_KEY: 'firebase-private-key',
    HL_STORAGE_S3_BUCKET: 'storage-s3-bucket',
    HL_TEST_DB_CONNECTION_STRING: process.env.HL_TEST_DB_CONNECTION_STRING,
    HL_FROM_EMAIL: 'no-reply@houselist.jamiecermak.dev',
    HL_SENDINBLUE_API_KEY: 'sendinblue-api-key',
    HL_DEV_TO_EMAIL: process.env.HL_DEV_TO_EMAIL,
}
