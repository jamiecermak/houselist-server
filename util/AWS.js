const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const s3Client = new S3Client()

/**
 *
 * @param {PutObjectCommandInput} params
 * @returns {PutObjectCommandOutput}
 */
async function putObject(params) {
    return s3Client.send(new PutObjectCommand(params))
}

module.exports = {
    putObject,
}
