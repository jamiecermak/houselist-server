const { database } = require('../util/Database')
const FirebaseApp = require('../util/FirebaseApp')

class FirebaseLib {
    async addFCMTokenToUser(userId, fcmToken) {
        try {
            await database
                .insert({
                    User_id: userId,
                    token: fcmToken,
                    is_active: 1,
                })
                .into('user_fcm_tokens')
                .onConflict('token')
                .ignore()
        } catch (ex) {
            throw new Error(`Could not add FCM Token for User ID ${userId}`)
        }
    }

    async getAllFCMTokensForUsers(userIds) {
        const tokens = await database
            .select(
                'user_fcm_tokens.id',
                'user_fcm_tokens.User_id',
                'user_fcm_tokens.token',
            )
            .from('user_fcm_tokens')
            .innerJoin('users', 'user_fcm_tokens.User_id', 'users.id')
            .whereIn('user_fcm_tokens.User_id', userIds)
            .where('user_fcm_tokens.is_active', 1)
            .where('users.is_active', 1)

        if (tokens.length === 0) {
            return []
        }

        return tokens.map(({ token }) => token)
    }

    async sendFCMPayloadToTokens(fcmPayload, tokens) {
        await FirebaseApp.getFirebaseMessaging().sendMulticast({
            ...fcmPayload,
            tokens,
        })
    }

    async sendFCMPayloadToUsers(fcmPayload, userIds) {
        try {
            const userTokens = await this.getAllFCMTokensForUsers(userIds)
            await this.sendFCMPayloadToTokens(fcmPayload, userTokens)
        } catch (ex) {
            throw new Error('Failed to send FCM Payloads')
        }
    }
}

module.exports = {
    FirebaseLib,
}
