const jwt = require('jsonwebtoken')
const { database } = require('../util/Database')
const { HL_JWT_SECRET } = require('../util/Secrets')
const { ServerAuthError } = require('../util/ServerErrors')

class AuthorisationLib {
    /**
     * Generate a JWT for a Given User ID
     *
     * @param {number} userId User ID
     * @param {string} expiresIn JWT Expiry
     * @param {string} jwtSecret JWT Secret
     * @returns {string} Encoded and Signed JWT
     */
    generateJWT(userId, expiresIn, jwtSecret) {
        return jwt.sign({ userId }, jwtSecret, {
            expiresIn,
        })
    }

    /**
     * Validate that a JWT was signed with a given secret,
     * returning the User ID
     *
     * @param {string} token Encoded and Signed JWT
     * @param {string} jwtSecret JWT Secret
     * @returns {number} User ID
     */
    validateJWT(token, jwtSecret) {
        const decodedToken = jwt.verify(token, jwtSecret)
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
            userId = this.validateJWT(token, HL_JWT_SECRET)
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
