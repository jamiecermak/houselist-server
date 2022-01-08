const { generateSignedUrl } = require('../util/AWS')
const { database } = require('../util/Database')
const Secrets = require('../util/Secrets')
const {
    ServerValidationError,
    ServerNotFoundError,
    ServerDatabaseError,
} = require('../util/ServerErrors')
const { AuthenticationLib } = require('./Authentication')
const { UserProfileImagesLib } = require('./UserProfileImages')

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
            throw new ServerValidationError(
                'New Password is not different from Old Password',
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
            .from('users')
            .where('id', userId)
            .where('is_active', 1)
            .first()

        // User was not found
        if (!user) {
            throw new ServerNotFoundError('user')
        }

        return {
            id: user.id,
            email_address: user.email_address,
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
            throw new ServerValidationError(
                'Old name and new name must not be the same',
                'Old name and new name must not be the same',
            )
        }

        // Update the name
        try {
            await database('users').where('id', userId).update({
                name: newName,
            })
        } catch (ex) {
            throw new ServerDatabaseError(ex)
        }
    }

    /**
     * Change a Users Profile Image to the Image Buffer,
     * returning the Bucket and Key for the new Image
     *
     * @param {number} userId User ID
     * @param {Buffer} imageBuffer Image Buffer
     * @returns {object} Bucket, Key
     */
    async changeUserProfileImage(userId, imageBuffer) {
        // Upload the new Image
        const userProfileImage = new UserProfileImagesLib()

        const bucket = Secrets.HL_STORAGE_S3_BUCKET
        const key = userProfileImage.generateProfileImageName()

        try {
            await userProfileImage.uploadProfileImageToS3(
                bucket,
                key,
                imageBuffer,
            )
        } catch (ex) {
            throw new ServerValidationError('AWS S3 Upload Failed')
        }

        // Update the User with the new Image Bucket and Key
        try {
            await database('users')
                .where('id', userId)
                .where('is_active', 1)
                .update({
                    profile_image_bucket: bucket,
                    profile_image_key: key,
                })
        } catch (ex) {
            throw new ServerDatabaseError(ex)
        }

        // Return Bucket and Key
        return {
            bucket,
            key,
        }
    }

    /**
     * Get information for an array of User IDs, with
     * signed profile image urls
     *
     * @param {Array<number>} userIds Array of User IDs
     * @returns {Array<object>} Array of Users
     */
    async getUsersByIds(userIds) {
        const users = await database
            .select('id', 'name', 'profile_image_bucket', 'profile_image_key')
            .whereIn('id', userIds)
            .where('is_active', 1)

        return users.map((user) => {
            const { id, name, profile_image_bucket, profile_image_key } = user

            return {
                id,
                name,
                profile_image_url:
                    profile_image_bucket && profile_image_key
                        ? generateSignedUrl(
                              profile_image_bucket,
                              profile_image_key,
                          )
                        : null,
            }
        })
    }
}

module.exports = {
    UsersLib,
}
