module.exports = {
    putObject: jest.fn(),
    generateSignedUrl: jest
        .fn()
        .mockImplementation((bucket, key) => `${bucket}/${key}`),
}
