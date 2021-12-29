const sharp = require('sharp')
const uuid = require('uuid')
const AWS = require('../util/AWS')

class UserProfileImagesLib {
    /**
     * Use Sharp to resize and encode an image buffer
     *
     * @param {Buffer} imageBuffer Input Image Buffer
     * @returns {Buffer} Output JPEG Buffer
     */
    async transformImage(imageBuffer) {
        return sharp(imageBuffer)
            .resize({
                width: 200,
                height: 200,
                fit: 'cover',
            })
            .jpeg({ quality: 90 })
            .toBuffer()
    }

    /**
     * Generate a random file name for a Profile Image
     * @returns {string}
     */
    generateProfileImageName() {
        return `profile-images/${uuid.v4()}.jpg`
    }

    /**
     * Upload an Image Buffer to S3
     *
     * @param {string} bucket
     * @param {string} key
     * @param {Buffer} imageBuffer
     */
    async uploadProfileImageToS3(bucket, key, imageBuffer) {
        const transformedImage = await this.transformImage(imageBuffer)

        await AWS.putObject({
            Bucket: bucket,
            Key: key,
            Body: transformedImage,
        })
    }
}

module.exports = {
    UserProfileImagesLib,
}
