const { database } = require('../../util/Database')
const mockDb = require('mock-knex')
const tracker = mockDb.getTracker()

jest.mock('sharp')
const sharp = require('sharp')

jest.mock('uuid')
const uuid = require('uuid')
const { UserProfileImagesLib } = require('../../lib/UserProfileImages')

beforeEach(() => {
    mockDb.mock(database)
    tracker.install()
})

afterEach(() => {
    tracker.uninstall()
    mockDb.unmock(database)
})

describe('transformImage', () => {
    it('will call sharp to transform an image buffer', () => {
        expect.assertions(8)

        const testBuffer = Buffer.from('test-input')

        const userProfileImages = new UserProfileImagesLib()

        return userProfileImages.transformImage(testBuffer).then((response) => {
            expect(response).toBeInstanceOf(Buffer)
            expect(response.toString()).toEqual('test-output')
            expect(sharp).toHaveBeenCalledTimes(1)
            expect(sharp).toHaveBeenCalledWith(testBuffer)
            expect(sharp().resize).toHaveBeenCalledWith({
                width: 200,
                height: 200,
                fit: 'cover',
            })
            expect(sharp().jpeg).toHaveBeenCalledTimes(1)
            expect(sharp().jpeg).toHaveBeenCalledWith({
                quality: 90,
            })
            expect(sharp().toBuffer).toHaveBeenCalledTimes(1)
        })
    })
})
