const { ServerNotFoundError } = require('../util/ServerErrors')

/**
 * Path Not Found Middleware Handler
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 */
function PathNotFoundHandler(req, res, next) {
    return next(new ServerNotFoundError('path'))
}

module.exports = {
    PathNotFoundHandler,
}
