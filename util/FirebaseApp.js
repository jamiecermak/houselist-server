const Firebase = require('firebase-admin')

const {
    HL_FIREBASE_PROJECT_ID,
    HL_FIREBASE_CLIENT_EMAIL,
    HL_FIREBASE_PRIVATE_KEY,
} = require('./Secrets')

function getFirebasePrivateKey() {
    return Buffer.from(HL_FIREBASE_PRIVATE_KEY, 'base64').toString('ascii')
}

function getFirebaseMessaging() {
    const FirebaseApp = Firebase.initializeApp({
        credential: Firebase.cert({
            projectId: HL_FIREBASE_PROJECT_ID,
            clientEmail: HL_FIREBASE_CLIENT_EMAIL,
            privateKey: getFirebasePrivateKey(),
        }),
    })

    return Firebase.messaging(FirebaseApp)
}

module.exports = {
    getFirebaseMessaging,
}
