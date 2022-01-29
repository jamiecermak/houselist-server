const { AuthorisationLib } = require('../lib/Authorisation')
const { ServerAuthError } = require('../util/ServerErrors')

/**
 * Check whether a Request is Authorised and set req.user.id to the Authorised User ID
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 */
async function IsAuthorised(req, res, next) {
    const authHeader = req.get('Authorization')

    if (!authHeader) {
        next(new ServerAuthError('No Authoization Header'))
    }

    const authorisation = new AuthorisationLib()

    try {
        const userId = await authorisation.authoriseJWT(authHeader)

        req.user = {
            id: userId,
        }
    } catch (ex) {
        return next(ex)
    }

    next()
}

module.exports = {
    IsAuthorised,
}
