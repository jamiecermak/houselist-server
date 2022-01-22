jest.unmock('sharp')

const { UserProfileImagesLib } = jest.requireActual(
    '../../lib/UserProfileImages',
)

const fs = require('fs')
const path = require('path')
const { v4: uuid } = jest.requireActual('uuid')
const testOutputPath = path.join(__dirname, '..', 'output')

beforeAll(() => {
    if (!fs.existsSync(testOutputPath)) {
        fs.mkdirSync(testOutputPath)
    }
})

describe('transformImage', () => {
    it('will transform a jpeg buffer', () => {
        expect.assertions(1)

        const testBuffer = fs.readFileSync(
            path.join(__dirname, '..', 'fixtures', 'profile-image.jpeg'),
        )

        const userProfileImages = new UserProfileImagesLib()

        return userProfileImages.transformImage(testBuffer).then((response) => {
            expect(response).toBeInstanceOf(Buffer)

            fs.writeFileSync(
                path.join(testOutputPath, `${uuid()}.jpeg`),
                response,
            )
        })
    })
})
