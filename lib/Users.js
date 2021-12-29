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

        await database('users').where('id', userId).update({
            password: hashedPassword,
        })
    }
}

module.exports = {
    UsersLib,
}
