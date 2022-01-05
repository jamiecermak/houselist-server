const { ServerValidationError } = require('../util/ServerErrors')

function PayloadValidator(shape, { path = 'body', showMessage = false } = {}) {
    return (req, res, next) => {
        try {
            const payload = req[path]

            if (!payload) {
                throw new Error('No Payload')
            }

            if (!Object.keys(req).includes('payload')) {
                req.payload = {}
            }

            req.payload[path] = shape.validateSync(payload)
            return next()
        } catch (ex) {
            return next(
                new ServerValidationError(
                    ex.message,
                    showMessage ? ex.message : null,
                ),
            )
        }
    }
}

module.exports = { PayloadValidator }
