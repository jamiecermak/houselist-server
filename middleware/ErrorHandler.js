function ErrorHandler(fn) {
    return async (req, res, next) => {
        try {
            await fn(req, res)
        } catch (ex) {
            next(ex)
        }
    }
}

module.exports = { ErrorHandler }
