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

    async getActiveUserById(userId) {
        const user = await database
            .select('id', 'email_address', 'name', 'username')
            .where('id', userId)
            .where('is_active', 1)
            .first()

        if (!user) {
            throw new Error(`User ID ${userId} not found`)
        }

        return {
            id: user.id,
            emailAddress: user.email_address,
            username: user.username,
            name: user.name,
        }
    }

    async updateUsersName(userId, newName) {
        const user = await this.getActiveUserById(userId)

        if (user.name == newName) {
            throw new Error('Old name and new name must not be the same')
        }

        try {
            await database('users').where('id', userId).update({
                name: newName,
            })
        } catch (ex) {
            throw new Error(`Could not update name for User ID ${userId}`)
        }
    }
}

module.exports = {
    UsersLib,
}
