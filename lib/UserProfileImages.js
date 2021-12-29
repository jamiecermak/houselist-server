const bcrypt = require('bcrypt')
const sharp = require('sharp')
const { database } = require('../util/Database')

class UserProfileImagesLib {
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
}

module.exports = {
    UserProfileImagesLib,
}
