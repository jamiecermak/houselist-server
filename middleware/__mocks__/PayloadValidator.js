module.exports = {
    PayloadValidator: jest
        .fn()
        .mockImplementation((_, { path = 'body' } = {}) => {
            return (req, res, next) => {
                if (!Object.keys(req).includes('payload')) {
                    req.payload = {}
                }

                req.payload[path] = req[path]

                next()
            }
        }),
}
