const mockSend = jest.fn()

module.exports = {
    EmailSenderLib: jest.fn().mockImplementation(() => {
        return {
            send: mockSend,
        }
    }),
    mockSend,
}
