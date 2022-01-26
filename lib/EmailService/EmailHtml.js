const fs = require('fs')
const path = require('path')

/**
 * Helpers that will get HTML Templates from the email/ project
 * directory
 */
class EmailHtmlLib {
    static PARTIALS_DIRECTORY = 'partials'
    static TEMPLATES_DIRECTORY = 'templates'

    /**
     * Get the contents of an HTML template from the Email directory
     *
     * @param {string} templateDir Directory to get the template from
     * @param {string} templateName Template name
     * @returns {string} Content
     */
    static getHtmlContents(templateDir, templateName) {
        const templatePath = path.join(
            __dirname,
            '..',
            '..',
            'email',
            templateDir,
            `${templateName}.html`,
        )

        return fs.readFileSync(templatePath).toString()
    }

    /**
     * Gets the file names in an Email Directory
     *
     * @param {string} templateDir Directory to read files from
     * @returns {Array<string>} Array of File Names
     */
    static getDirectoryContents(templateDir) {
        const templatePath = path.join(
            __dirname,
            '..',
            '..',
            'email',
            templateDir,
        )

        return fs
            .readdirSync(templatePath)
            .map((fileName) => fileName.replace('.html', ''))
    }
}

module.exports = {
    EmailHtmlLib,
}
