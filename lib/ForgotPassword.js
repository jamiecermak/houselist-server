const { database } = require('../util/Database')
const { v4: uuid } = require('uuid')
const { add: addTime, isBefore, parseISO } = require('date-fns')
const { UsersLib } = require('./Users')

class ForgotPasswordLib {
    generateResetToken() {
        return uuid()
    }

    generateResetExpiry(addDays = 1) {
        return addTime(new Date(), {
            days: addDays,
        }).toISOString()
    }

    async generateResetTokenForUser(emailAddress) {
        const user = await database
            .select('id', 'email_address')
            .from('users')
            .where('email_address', emailAddress)
            .where('is_active', 1)
            .where('is_deleted', 0)
            .first()

        if (!user) {
            throw new Error(`User with Email Address ${emailAddress} not found`)
        }

        const resetToken = this.generateResetToken()
        const tokenExpiry = this.generateResetExpiry()

        const createdTokenRecord = await this.createTokenRecord(
            user.id,
            resetToken,
            tokenExpiry,
        )

        if (!createdTokenRecord) {
            throw new Error(`Could not create token for User ID ${user.id}`)
        }

        return {
            emailAddress: user.email_address,
            token: resetToken,
            expiry: tokenExpiry,
        }
    }

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

    async verifyResetToken(emailAddress, resetToken) {
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

        if (!token) {
            throw new Error('Invalid Reset Token')
        }

        const expiryDate = parseISO(token.expiry_date)

        if (isBefore(expiryDate, new Date())) {
            throw new Error('Expired Token')
        }

        return {
            id: token.id,
            User_id: token.User_id,
        }
    }

    async resetPasswordWithToken(
        emailAddress,
        resetToken,
        newPassword,
        ipAddress,
    ) {
        const token = await this.verifyResetToken(emailAddress, resetToken)

        // reset password
        const users = new UsersLib()

        await users.setPassword(token.User_id, newPassword)
        await this.useResetToken(token.id, ipAddress)
    }

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
