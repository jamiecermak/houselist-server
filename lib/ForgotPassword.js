const { database } = require('../util/Database')
const { v4: uuid } = require('uuid')
const { add: addTime } = require('date-fns')

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
}

module.exports = {
    ForgotPasswordLib,
}
