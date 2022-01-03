const { SuccessResponse, ErrorResponse } = require('../../util/APIResponses')
const {
    ServerError,
    ServerValidationError,
} = require('../../util/ServerErrors')

describe('SuccessResponse', () => {
    it('will create a 200 success response with object data', () => {
        const successResponse = new SuccessResponse([1, 2, 3])

        expect(successResponse.asObject()).toEqual({
            success: true,
            data: [1, 2, 3],
            message: null,
        })

        expect(successResponse.statusCode).toEqual(200)
    })

    it('will create a 200 success response with no object data', () => {
        const successResponse = new SuccessResponse()

        expect(successResponse.asObject()).toEqual({
            success: true,
            data: null,
            message: null,
        })

        expect(successResponse.statusCode).toEqual(200)
    })

    it('will create a success response with data, a message, and an overridden status code', () => {
        const successResponse = new SuccessResponse([1, 2, 3], {
            message: 'test message',
            statusCode: 204,
        })

        expect(successResponse.asObject()).toEqual({
            success: true,
            data: [1, 2, 3],
            message: 'test message',
        })

        expect(successResponse.statusCode).toEqual(204)
    })
})

describe('ErrorResponse', () => {
    it('will create a 500 error response with a message', () => {
        const errorResponse = new ErrorResponse('test message')

        expect(errorResponse.asObject()).toEqual({
            success: false,
            data: null,
            message: 'test message',
        })

        expect(errorResponse.statusCode).toEqual(500)
    })

    it('will create a error response with data, a message, and an overridden status code', () => {
        const errorResponse = new ErrorResponse('test message', {
            data: [1, 2, 3],
            statusCode: 400,
        })

        expect(errorResponse.asObject()).toEqual({
            success: false,
            data: [1, 2, 3],
            message: 'test message',
        })

        expect(errorResponse.statusCode).toEqual(400)
    })

    it('will create an error response from a normal exception with hidden info', () => {
        const exception = new Error('a test error no message')
        const errorResponse = ErrorResponse.fromException(exception)

        expect(errorResponse.asObject()).toEqual({
            success: false,
            data: null,
            message:
                'An unknown internal error occurred. Please try again later.',
        })

        expect(errorResponse.statusCode).toEqual(500)
    })

    it('will create an error response from a server exception with hidden info', () => {
        const exception = new ServerError(
            400,
            'Validation Error',
            'There is an error with your request.',
        )
        const errorResponse = ErrorResponse.fromException(exception)

        expect(errorResponse.asObject()).toEqual({
            success: false,
            data: null,
            message: 'There is an error with your request.',
        })

        expect(errorResponse.statusCode).toEqual(400)
    })

    it('will create an error response from a server exception with hidden info and data', () => {
        const exception = new ServerError(
            400,
            'Validation Error',
            'There is an error with your request.',
            [1, 2, 3],
        )
        const errorResponse = ErrorResponse.fromException(exception)

        expect(errorResponse.asObject()).toEqual({
            success: false,
            data: [1, 2, 3],
            message: 'There is an error with your request.',
        })

        expect(errorResponse.statusCode).toEqual(400)
    })

    it('will create an error response from a inherited server exception with hidden info', () => {
        class ServerTestError extends ServerError {
            constructor() {
                super(404, 'test error', 'test human error')
            }
        }

        const exception = new ServerTestError()
        const errorResponse = ErrorResponse.fromException(exception)

        expect(errorResponse.asObject()).toEqual({
            success: false,
            data: null,
            message: 'test human error',
        })

        expect(errorResponse.statusCode).toEqual(404)
    })
})
