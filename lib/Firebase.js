const { database } = require('../util/Database')
const FirebaseApp = require('../util/FirebaseApp')
const {
    ServerDatabaseError,
    ServerGeneralError,
} = require('../util/ServerErrors')

class FirebaseLib {
    /**
     * Add a Firebase Cloud Messaging Device Token to a
     * given User, ignoring the Insert if the token already
     * exists
     *
     * @param {number} userId User ID
     * @param {string} fcmToken Firebase Cloud Messaging Token
     * @param {string} deviceId Hardware Token from the Device
     */
    async addFCMTokenToUser(userId, fcmToken, deviceId, deviceName) {
        try {
            await database
                .insert({
                    User_id: userId,
                    token: fcmToken,
                    device_id: deviceId,
                    device_name: deviceName,
                    is_active: 1,
                })
                .into('user_fcm_tokens')
                .onConflict('token')
                .ignore()
        } catch (ex) {
            throw new ServerDatabaseError(ex)
        }
    }

    /**
     * Get all Firebase Cloud Messaging Device Tokens for a
     * given set of User IDs
     *
     * @param {Array<number>} userIds User IDs
     * @returns {Array<string>} FCM Tokens
     */
    async getAllFCMTokensForUsers(userIds) {
        // Get all FCM Tokens for an array of User IDs
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

        return tokens.map(({ token }) => token)
    }

    /**
     * Send a Firebase Cloud Messaging payload to an
     * array of Device Tokens
     *
     * @param {object} fcmPayload
     * @param {Array<string>} tokens
     */
    async sendFCMPayloadToTokens(fcmPayload, tokens) {
        await FirebaseApp.getFirebaseMessaging().sendMulticast({
            ...fcmPayload,
            tokens,
        })
    }

    /**
     * Send a Firebase Cloud Messaging payload to an
     * array of User IDs
     *
     * @param {object} fcmPayload
     * @param {Array<number>} userIds
     */
    async sendFCMPayloadToUsers(fcmPayload, userIds) {
        try {
            const userTokens = await this.getAllFCMTokensForUsers(userIds)
            await this.sendFCMPayloadToTokens(fcmPayload, userTokens)
        } catch (ex) {
            throw new ServerGeneralError('Failed to send FCM Payloads')
        }
    }
}

module.exports = {
    FirebaseLib,
}
