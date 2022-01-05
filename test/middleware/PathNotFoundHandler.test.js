const { PathNotFoundHandler } = require('../../middleware/PathNotFoundHandler')
const { ServerNotFoundError } = require('../../util/ServerErrors')

describe('PathNotFound Middleware', () => {
    it('calls next with a ServerNotFoundError', () => {
        const next = jest.fn()

        PathNotFoundHandler({}, {}, next)

        expect(next.mock.calls[0][0]).toBeInstanceOf(ServerNotFoundError)
        expect(next.mock.calls[0][0].humanMessage).toEqual(
            'The requested path does not exist.',
        )
    })
})
