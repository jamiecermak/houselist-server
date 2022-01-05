const yup = require('yup')
const { PayloadValidator } = require('../../middleware/PayloadValidator')
const { ServerValidationError } = require('../../util/ServerErrors')

describe('PayloadValidator Middleware', () => {
    let req
    let next

    beforeEach(() => {
        req = {
            get: jest.fn(),
        }

        next = jest.fn()
    })

    it('will validate a valid payload', () => {
        const yupShape = yup.object().shape({
            testVar: yup.string(),
        })

        req.body = { testVar: 'some-string' }

        const payloadValidator = PayloadValidator(yupShape)
        payloadValidator(req, {}, next)

        expect(next).toBeCalledWith()
        expect(next).toBeCalledTimes(1)
    })

    it('will call next with a ServerValidationError if it is not a valid payload', () => {
        const yupShape = yup.object().shape({
            testVar: yup.array(),
        })

        req.body = { testVar: 'some-string' }

        const payloadValidator = PayloadValidator(yupShape)
        payloadValidator(req, {}, next)

        expect(next.mock.calls[0][0]).toBeInstanceOf(ServerValidationError)
        expect(next).toBeCalledTimes(1)
    })

    it('will call next with a ServerValidationError if there is no payload', () => {
        const yupShape = yup.object().shape({
            testVar: yup.array(),
        })

        req.body = undefined

        const payloadValidator = PayloadValidator(yupShape)
        payloadValidator(req, {}, next)

        expect(next.mock.calls[0][0]).toBeInstanceOf(ServerValidationError)
        expect(next).toBeCalledTimes(1)
    })

    it('will call next with ServerValidationError that contains the human error if showMessage is set', () => {
        const yupShape = yup.object().shape({
            testVar: yup.array(),
        })

        yupShape.validateSync = jest.fn().mockImplementation(() => {
            throw new Error('test validation message')
        })

        req.body = { testVar: 'some-string' }

        const payloadValidator = PayloadValidator(yupShape, {
            showMessage: true,
        })
        payloadValidator(req, {}, next)

        expect(next.mock.calls[0][0]).toBeInstanceOf(ServerValidationError)
        expect(next.mock.calls[0][0].humanMessage).toContain(
            'test validation message',
        )
    })

    it('will insert the validated payload into req.payload.body', () => {
        const yupShape = yup.object().shape({
            testVar: yup.string(),
        })

        req.body = { testVar: 'some-test' }

        const payloadValidator = PayloadValidator(yupShape)
        payloadValidator(req, {}, next)

        expect(req.payload.body).toEqual({
            testVar: 'some-test',
        })
    })

    it('will allow more than 1 call to different paths', () => {
        const yupShape = yup.object().shape({
            testVar: yup.string(),
        })

        req.body = { testVar: 'some-test' }
        req.query = { testVar: '123-456' }

        const bodyPayloadValidator = PayloadValidator(yupShape, {
            path: 'body',
        })

        bodyPayloadValidator(req, {}, next)

        const queryPayloadValidator = PayloadValidator(yupShape, {
            path: 'query',
        })

        queryPayloadValidator(req, {}, next)

        expect(req.payload).toEqual({
            body: {
                testVar: 'some-test',
            },
            query: {
                testVar: '123-456',
            },
        })
    })
})
