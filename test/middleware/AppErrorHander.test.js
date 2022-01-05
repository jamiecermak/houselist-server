const { AppErrorHandler } = require('../../middleware/AppErrorHandler')
const { ServerError } = require('../../util/ServerErrors')

class TestServerError extends ServerError {
    constructor(data) {
        super(499, 'system message', 'human message', data)
    }
}

describe('AppErrorHandler Middleware', () => {
    let res = {
        status: jest.fn(),
        json: jest.fn(),
    }
    let next = jest.fn()

    beforeEach(() => {
        next = jest.fn()
        res = {
            status: jest.fn(),
            json: jest.fn(),
        }
    })

    it('will respond with an error payload if given an unknown exception', () => {
        const unknownError = new Error('unknown error')

        AppErrorHandler(unknownError, { headersSent: false }, res, next)

        expect(res.json).toBeCalledWith({
            success: false,
            message:
                'An unknown internal error occurred. Please try again later.',
            data: null,
        })
        expect(res.status).toBeCalledWith(500)
        expect(next).not.toBeCalled()
    })

    it('will identify server errors', () => {
        const serverError = new TestServerError(null)

        AppErrorHandler(serverError, { headersSent: false }, res, next)

        expect(res.json).toBeCalledWith({
            success: false,
            message: 'human message',
            data: null,
        })
        expect(res.status).toBeCalledWith(499)
        expect(next).not.toBeCalled()
    })

    it('will send response data if server error has data', () => {
        const serverError = new TestServerError([1, 2, 3])

        AppErrorHandler(serverError, { headersSent: false }, res, next)

        expect(res.json).toBeCalledWith({
            success: false,
            message: 'human message',
            data: [1, 2, 3],
        })
    })

    it('will pass through to next if headers have been sent', () => {
        const serverError = new TestServerError(null)

        AppErrorHandler(serverError, { headersSent: true }, res, next)

        expect(res.json).not.toBeCalled()
        expect(res.status).not.toBeCalled()
        expect(next).toBeCalledWith(serverError)
    })
})
