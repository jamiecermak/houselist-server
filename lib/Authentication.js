const bcrypt = require('bcrypt')
const { database } = require('../util/Database')
const { ServerValidationError } = require('../util/ServerErrors')

class AuthenticationLib {
    hashPassword(password) {
        return bcrypt.hashSync(password, 12)
    }

    validatePassword(userPassword, dbPassword) {
        return bcrypt.compareSync(userPassword, dbPassword)
    }

    /**
     * Authenticate a Users Email Address and Password
     *
     * @param {string} emailAddress Email Address
     * @param {string} password Plaintext Password
     * @returns {number} User ID
     */
    async authenticateUser(emailAddress, password) {
        // Get active users with the given email address
        const user = await database
            .select('id', 'email_address', 'password', 'is_active')
            .from('users')
            .where('email_address', emailAddress)
            .where('is_active', 1)
            .first()

        // User wasn't found
        if (!user) {
            throw new ServerValidationError(
                `User with Email Address ${emailAddress} not found`,
                'Incorrect Email Address or Password',
            )
        }

        // Password was incorrect
        if (!this.validatePassword(password, user.password)) {
            throw new ServerValidationError(
                `Invalid Password for User ID ${user.id}`,
                'Incorrect Email Address or Password',
            )
        }

        return user.id
    }
}

module.exports = {
    AuthenticationLib,
}
