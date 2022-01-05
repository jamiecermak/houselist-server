module.exports = {
    mockUserId: 1234,
    IsAuthorised: jest.fn().mockImplementation((req, res, next) => {
        next()
    }),
}
