const {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
} = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const s3Client = new S3Client()

/**
 *
 * @param {PutObjectCommandInput} params
 * @returns {PutObjectCommandOutput}
 */
async function putObject(params) {
    return s3Client.send(new PutObjectCommand(params))
}

/**
 * Generate a pre-signed S3 URL for 3600 seconds
 *
 * @param {string} bucket S3 Bucket
 * @param {string} keyName S3 Object Key
 * @returns {string} Signed S3 URL
 */
function generateSignedUrl(bucket, keyName) {
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: keyName,
    })

    return getSignedUrl(s3Client, command, {
        expiresIn: 3600,
    })
}

module.exports = {
    putObject,
    generateSignedUrl,
}
