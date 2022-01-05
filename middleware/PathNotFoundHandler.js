const { ServerNotFoundError } = require('../util/ServerErrors')

function PathNotFoundHandler(req, res, next) {
    return next(new ServerNotFoundError('path'))
}

module.exports = {
    PathNotFoundHandler,
}
