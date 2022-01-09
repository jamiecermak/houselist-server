/**
 * Route level Error Handler Middleware
 *
 * @param {*} fn
 * @returns
 */
function ErrorHandler(fn) {
    return async (req, res, next) => {
        try {
            await fn(req, res)
        } catch (ex) {
            return next(ex)
        }
    }
}

module.exports = { ErrorHandler }
