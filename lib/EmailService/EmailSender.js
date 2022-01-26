const { sendEmail } = require('../../util/Sendinblue')
const { EmailTemplateLib } = require('./EmailTemplate')

/**
 * Helpers to send emails via AWS SES
 */
class EmailSenderLib {
    subject = null
    templateData = {}
    template = null

    constructor(templateName, subject, baseTemplateData = {}) {
        this.templateData = baseTemplateData
        this.template = new EmailTemplateLib(templateName, subject)
    }

    send(name, emailAddress, dataOverride = {}) {
        const compiledHtml = this.template.buildHtml({
            client_name: name,
            ...this.templateData,
            dataOverride,
        })

        return sendEmail(
            name,
            emailAddress,
            compiledHtml.subject,
            compiledHtml.template,
        )
    }
}

module.exports = {
    EmailSenderLib,
}
