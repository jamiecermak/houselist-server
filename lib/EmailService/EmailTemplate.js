const handlebars = require('handlebars')
const { EmailHtmlLib } = require('./EmailHtml')

/**
 * Helpers to build email templates using Handlebars
 */
class EmailTemplateLib {
    hbInstance = handlebars.create()
    template = null
    subjectTemplate = null

    constructor(templateName, subject) {
        this.registerPartials()

        this.template = this.compileTemplate(
            EmailHtmlLib.TEMPLATES_DIRECTORY,
            templateName,
        )

        this.subjectTemplate = this.hbInstance.compile(subject)
    }

    /**
     * Compile a Handlebars template by loading Html from the Project
     *
     * @param {string} templateDirectory Email Template Directory
     * @param {string} templateName Template Name
     * @returns {HandlebarsTemplateDelegate<any>} Handlebars Compiled Template
     */
    compileTemplate(templateDirectory, templateName) {
        const content = EmailHtmlLib.getHtmlContents(
            templateDirectory,
            templateName,
        )

        return this.hbInstance.compile(content)
    }

    /**
     * Register a Handlebars Partial with the current Instance
     *
     * @param {*} partialName Partial Name
     */
    registerPartial(partialName) {
        const partial = this.compileTemplate(
            EmailHtmlLib.PARTIALS_DIRECTORY,
            partialName,
        )

        this.hbInstance.registerPartial(partialName, partial)
    }

    /**
     * Register all partials found in the PARTIALS_DIRECTORY
     */
    registerPartials() {
        const that = this

        // Get all files from the partials directory
        const partialTemplateNames = EmailHtmlLib.getDirectoryContents(
            EmailHtmlLib.PARTIALS_DIRECTORY,
        )

        // Register them all
        partialTemplateNames.forEach((name) => {
            that.registerPartial(name)
        })
    }

    /**
     * Build Html from the Template, with Data injected
     *
     * @param {Object<any>} data Data to Inject into Template
     * @returns {Object} Compiled Html and Subject Strings
     */
    buildEmail(data) {
        return {
            template: this.template(data),
            subject: this.subjectTemplate(data),
        }
    }
}

module.exports = {
    EmailTemplateLib,
}
