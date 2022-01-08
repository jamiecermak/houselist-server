module.exports = {
    IsAuthorised: jest.fn().mockImplementation((req, res, next) => {
        req.user = {
            id: 1,
        }
        next()
    }),
}
