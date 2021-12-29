const { database } = require('../util/Database')
const { AuthenticationLib } = require('./Authentication')

class UsersLib {
    /**
     * Set a Users Password
     *
     * @param {number} userId User ID
     * @param {string} newPassword New Plaintext Password
     */
    async setPassword(userId, newPassword) {
        // Get active User
        const user = await database
            .select('id', 'password')
            .from('users')
            .where('id', userId)
            .where('is_active', 1)
            .first()

        // Ensure that the new password is different from the old one
        const authentication = new AuthenticationLib()

        if (authentication.validatePassword(newPassword, user.password)) {
            throw new Error(
                'Your New Password must be different from your old password',
            )
        }

        // Hash the new Password
        const hashedPassword = authentication.hashPassword(newPassword)

        // Override the existing one in the DB
        await database('users').where('id', userId).update({
            password: hashedPassword,
        })
    }

    /**
     * Get an Active User's Information by User ID
     * @param {number} userId User ID
     * @returns {object}
     */
    async getActiveUserById(userId) {
        // Get first active user for the User ID
        const user = await database
            .select('id', 'email_address', 'name', 'username')
            .where('id', userId)
            .where('is_active', 1)
            .first()

        // User was not found
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

    /**
     * Update a User's Name
     *
     * @param {number} userId User ID
     * @param {string} newName New Name
     */
    async updateUsersName(userId, newName) {
        const user = await this.getActiveUserById(userId)

        // Ensure that the new name is different from the old one
        if (user.name == newName) {
            throw new Error('Old name and new name must not be the same')
        }

        // Update the name
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
