jest.mock('fs')

const { EmailHtmlLib } = require('../../../lib/EmailService/EmailHtml')
const fs = require('fs')

afterEach(() => {
    fs.readFileSync.mockClear()
    fs.readdirSync.mockClear()
})

describe('EmailHtml', () => {
    describe('getHtmlContents', () => {
        it('loads files from the correct directory', () => {
            expect.assertions(1)

            fs.readFileSync.mockImplementation((path) => {
                expect(path.toString()).toContain(
                    'email/test-dir/test-template.html',
                )

                return Buffer.from('test-returns')
            })

            EmailHtmlLib.getHtmlContents('test-dir', 'test-template')
        })

        it('returns a string', () => {
            expect.assertions(1)

            fs.readFileSync.mockImplementation(() => {
                return Buffer.from('test-returns')
            })

            const result = EmailHtmlLib.getHtmlContents(
                'test-dir',
                'test-template',
            )

            expect(result).toEqual('test-returns')
        })
    })

    describe('getDirectoryContents', () => {
        it('reads files from the correct directory', () => {
            expect.assertions(1)

            fs.readdirSync.mockImplementation((path) => {
                expect(path.toString()).toContain('email/test-dir')

                return []
            })

            EmailHtmlLib.getDirectoryContents('test-dir')
        })

        it('returns a list of files in an email directory without html', () => {
            fs.readdirSync.mockImplementation((path) => {
                expect(path.toString()).toContain('email/test-dir')

                return ['file-1.html', 'file-2.html']
            })

            const files = EmailHtmlLib.getDirectoryContents('test-dir')

            expect(files).toEqual(['file-1', 'file-2'])
        })
    })
})
