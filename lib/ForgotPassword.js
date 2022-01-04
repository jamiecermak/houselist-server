const { database } = require('../util/Database')
const { v4: uuid } = require('uuid')
const { add: addTime, isBefore, parseISO } = require('date-fns')
const { UsersLib } = require('./Users')
const {
    ServerGeneralError,
    ServerValidationError,
} = require('../util/ServerErrors')

class ForgotPasswordLib {
    /**
     * Generate a Forgotten Password Reset Token
     * @returns {string} Token
     */
    generateResetToken() {
        return uuid()
    }

    /**
     * Generate a ISO 8601 Expiry Date
     *
     * @param {number} addDays Number of Days before Expiry
     * @returns {string} ISO 8601 Date
     */
    generateResetExpiry(addDays = 1) {
        return addTime(new Date(), {
            days: addDays,
        }).toISOString()
    }

    /**
     * Generate a Reset Token for a valid
     * User's Email Address
     *
     * @param {string} emailAddress Email Address
     * @returns {object}
     */
    async generateResetTokenForUser(emailAddress) {
        // Get all active and non-deleted users with the given
        // email address
        const user = await database
            .select('id', 'email_address')
            .from('users')
            .where('email_address', emailAddress)
            .where('is_active', 1)
            .where('is_deleted', 0)
            .first()

        // User wasn't found
        if (!user) {
            throw new ServerValidationError(
                `User with Email Address ${emailAddress} not found`,
            )
        }

        // Generate a Reset Token and Expiry Date
        const resetToken = this.generateResetToken()
        const tokenExpiry = this.generateResetExpiry()

        // Create the Token Record
        const createdTokenRecord = await this.createTokenRecord(
            user.id,
            resetToken,
            tokenExpiry,
        )

        // The record failed to create
        if (!createdTokenRecord) {
            throw new ServerGeneralError(
                `Could not create token for User ID ${user.id}`,
            )
        }

        return {
            emailAddress: user.email_address,
            token: resetToken,
            expiry: tokenExpiry,
        }
    }

    /**
     * Create a DB Record for a Forgotten Password token
     *
     * @param {number} userId User ID
     * @param {string} resetToken UUID Reset Token
     * @param {string} expiry ISO 8601 Date
     * @returns {boolean}
     */
    async createTokenRecord(userId, resetToken, expiry) {
        try {
            await database
                .insert({
                    User_id: userId,
                    reset_token: resetToken,
                    expiry_date: expiry,
                })
                .into('password_reset_tokens')
        } catch (ex) {
            return false
        }

        return true
    }

    /**
     * Verify that a Reset Token for an Email Address is valid
     * @param {string} emailAddress Email Address
     * @param {string} resetToken Reset Token
     * @returns {object}
     */
    async verifyResetToken(emailAddress, resetToken) {
        // Get the first valid record for the token and email address
        const token = await database
            .select(
                'password_reset_tokens.id',
                'password_reset_tokens.User_id',
                'password_reset_tokens.expiry_date',
            )
            .from('password_reset_tokens')
            .innerJoin('users', 'password_reset_tokens.User_id', 'users.id')
            .where('users.email_address', emailAddress)
            .where('users.is_active', 1)
            .where('password_reset_tokens.is_used', 0)
            .where('password_reset_tokens.reset_token', resetToken)
            .orderBy('password_reset_tokens.id', 'desc')
            .first()

        // Token wasn't found
        if (!token) {
            throw new ServerValidationError(
                'Invalid Reset Token',
                'Invalid Reset Token',
            )
        }

        // Check the expiry date against the database record
        const expiryDate = parseISO(token.expiry_date)

        if (isBefore(expiryDate, new Date())) {
            throw new ServerValidationError(
                'Expired Token',
                'Invalid Reset Token',
            )
        }

        return {
            id: token.id,
            User_id: token.User_id,
        }
    }

    /**
     * Reset a Users Password with a Valid Token
     *
     * @param {*} emailAddress Email Address
     * @param {*} resetToken Reset Token
     * @param {*} newPassword New Plaintext Password
     * @param {*} ipAddress Requester IP Address
     */
    async resetPasswordWithToken(
        emailAddress,
        resetToken,
        newPassword,
        ipAddress,
    ) {
        // Verify the Token
        const token = await this.verifyResetToken(emailAddress, resetToken)

        // Reset the Password
        const users = new UsersLib()

        await users.setPassword(token.User_id, newPassword)

        // Ensure that the reset token can't be used again
        await this.useResetToken(token.id, ipAddress)
    }

    /**
     * Update a Reset Token so that it can't be used again
     *
     * @param {number} resetTokenId Reset Token ID
     * @param {string} ipAddress Requesters IP Address
     */
    async useResetToken(resetTokenId, ipAddress) {
        const currentDate = new Date()

        try {
            await database('password_reset_tokens')
                .where('id', resetTokenId)
                .update({
                    is_used: 1,
                    used_at: currentDate.toISOString(),
                    used_by: ipAddress,
                })
        } catch (ex) {
            throw new Error('Failed to use reset token')
        }
    }
}

module.exports = {
    ForgotPasswordLib,
}
