module.exports = {
    ListItemValidator: jest.fn().mockImplementation(() => {
        return (req, res, next) => {
            if (!Object.keys(req).includes('payload')) {
                req.payload = {}
            }

            if (!Object.keys(req.payload).includes('params')) {
                req.payload.params = {}
            }

            req.payload.params.listId = parseInt(req.params.listId)
            req.payload.params.itemId = parseInt(req.params.itemId)

            next()
        }
    }),
}
