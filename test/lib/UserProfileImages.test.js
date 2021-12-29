const { database } = require('../../util/Database')
const mockDb = require('mock-knex')
const tracker = mockDb.getTracker()

jest.mock('sharp')
const sharp = require('sharp')

jest.mock('../../util/AWS')
const AWS = require('../../util/AWS')

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

describe('uploadProfileImageToS3', () => {
    it('will upload a image buffer to S3', () => {
        const bucket = 'test-bucket'
        const keyName = 'profile-images/test-uuid.jpg'
        const testBuffer = Buffer.from('test-input')
        const testImageOutput = Buffer.from('test-output')

        const userProfileImages = new UserProfileImagesLib()

        const transformImage = jest
            .spyOn(userProfileImages, 'transformImage')
            .mockResolvedValue(testImageOutput)

        return userProfileImages
            .uploadProfileImageToS3(bucket, keyName, testBuffer)
            .then(() => {
                expect(transformImage).toHaveBeenCalledTimes(1)
                expect(transformImage).toHaveBeenCalledWith(testBuffer)
                expect(AWS.putObject).toHaveBeenCalledTimes(1)
                expect(AWS.putObject).toHaveBeenCalledWith({
                    Bucket: bucket,
                    Key: keyName,
                    Body: testImageOutput,
                })
            })
    })
})

describe('generateProfileImageName', () => {
    it('will generate a string with a path for S3', () => {
        const userProfileImages = new UserProfileImagesLib()

        const response = userProfileImages.generateProfileImageName()

        expect(response).toEqual('profile-images/test-uuid.jpg')
    })
})
