const jwt = require('jsonwebtoken')
const { database } = require('../util/Database')
const { HL_JWT_SECRET, HL_JWT_EXPIRY } = require('../util/Secrets')
const { ServerAuthError } = require('../util/ServerErrors')

class AuthorisationLib {
    /**
     * Generate a JWT for a Given User ID
     *
     * @param {number} userId User ID
     * @returns {string} Encoded and Signed JWT
     */
    generateJWT(userId) {
        return jwt.sign({ userId }, HL_JWT_SECRET, {
            expiresIn: HL_JWT_EXPIRY,
        })
    }

    /**
     * Validate that a JWT was signed with a given secret,
     * returning the User ID
     *
     * @param {string} token Encoded and Signed JWT
     * @returns {number} User ID
     */
    validateJWT(token) {
        const decodedToken = jwt.verify(token, HL_JWT_SECRET)
        return decodedToken.userId
    }

    /**
     * Ensure that a JWT is valid, and that the User
     * is Authorised to interact with the API
     *
     * @param {string} token Encoded and signed JWT
     * @returns {number} User ID
     */
    async authoriseJWT(token) {
        let userId

        // Attempt to validate the JWT
        try {
            userId = this.validateJWT(token)
        } catch (ex) {
            throw new ServerAuthError('Failed to verify authorisation token')
        }

        // Get all active Users with the provided User ID
        const user = await database
            .select('id')
            .from('users')
            .where('id', userId)
            .where('is_active', 1)
            .first()

        // User was not found
        if (!user) {
            throw new ServerAuthError('Invalid or inactive user')
        }

        return user.id
    }
}

module.exports = {
    AuthorisationLib,
}
