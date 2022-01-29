const { ServerValidationError } = require('../util/ServerErrors')

/**
 * Validate a Request against a Yup Shape Object
 *
 * @param {object} shape Yup Shape Payload
 * @param {object} param1 Options
 * @returns
 */
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

            if (!Object.keys(req.payload).includes(path)) {
                req.payload[path] = {}
            }

            req.payload[path] = {
                ...req.payload[path],
                ...shape.validateSync(payload),
            }

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
