const { ErrorHandler } = require('../../middleware/ErrorHandler')

describe('ErrorHandler Middleware', () => {
    it('will call next with an error if an exception is thrown', () => {
        expect.assertions(1)
        const error = new Error('test')
        const fn = jest.fn().mockRejectedValue(error)
        const next = jest.fn()

        const errorHandler = ErrorHandler(fn)

        return errorHandler({}, {}, next).then(() => {
            expect(next).toBeCalledWith(error)
        })
    })

    it('will pass through req, res to the lower function', () => {
        expect.assertions(1)

        const fn = jest.fn().mockResolvedValue(true)
        const next = jest.fn()
        const req = {}
        const res = {}

        const errorHandler = ErrorHandler(fn)

        return errorHandler(req, res, next).then(() => {
            expect(fn).toBeCalledWith(req, res)
        })
    })

    it('will return a function', () => {
        const errorHandler = ErrorHandler(() => {})

        expect(typeof errorHandler).toEqual('function')
    })
})
