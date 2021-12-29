const jwt = require('jsonwebtoken')
const { database } = require('../util/Database')
const { HL_JWT_SECRET } = require('../util/Secrets')

class AuthorisationLib {
    generateJWT(userId, expiresIn, jwtSecret) {
        return jwt.sign({ userId }, jwtSecret, {
            expiresIn,
        })
    }

    validateJWT(token, jwtSecret) {
        const decodedToken = jwt.verify(token, jwtSecret)
        return decodedToken.userId
    }

    async authoriseJWT(token) {
        let userId

        try {
            userId = this.validateJWT(token, HL_JWT_SECRET)
        } catch (ex) {
            throw new Error('Failed to verify authorisation token')
        }

        const user = await database
            .select('id')
            .from('users')
            .where('id', userId)
            .where('is_active', 1)
            .first()

        if (!user) {
            throw new Error('Invalid or inactive user')
        }

        return user.id
    }
}

module.exports = {
    AuthorisationLib,
}
