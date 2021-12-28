const { database } = require('../util/Database')
const { AuthenticationLib } = require('./Authentication')

class UsersLib {
    async setPassword(userId, newPassword) {
        const user = await database
            .select('id', 'password')
            .from('users')
            .where('id', userId)
            .where('is_active', 1)
            .first()

        const authentication = new AuthenticationLib()

        if (authentication.validatePassword(newPassword, user.password)) {
            throw new Error(
                'Your New Password must be different from your old password',
            )
        }

        const hashedPassword = authentication.hashPassword(newPassword)

        try {
            await database('users').where('id', userId).update({
                password: hashedPassword,
            })
        } catch (ex) {
            throw new Error(`Failed to set password for User ID ${userId}`)
        }
    }
}

module.exports = {
    UsersLib,
}
