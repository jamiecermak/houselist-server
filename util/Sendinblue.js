const { default: axios } = require('axios')
const Secrets = require('./Secrets')

const SENDINBLUE_API_URL = 'https://api.sendinblue.com/v3/smtp/email'

/**
 * Send an email using the Sendinblue API
 *
 * @param {string} toName Name to Address Email To
 * @param {string} toEmailAddress Email Address to Send To
 * @param {string} subject Subject of Email
 * @param {string} htmlContent HTML Content of Email
 * @returns
 */
function sendEmail(toName, toEmailAddress, subject, htmlContent) {
    let toEmail = toEmailAddress

    if (process.env.NODE_ENV != 'production') {
        toEmail = Secrets.HL_DEV_TO_EMAIL
    }

    return axios.post(
        SENDINBLUE_API_URL,
        {
            sender: {
                name: 'Houselist No-Reply',
                email: Secrets.HL_FROM_EMAIL,
            },
            to: {
                name: toName,
                email: toEmail,
            },
            subject,
            htmlContent,
        },
        {
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                'api-key': Secrets.HL_SENDINBLUE_API_KEY,
            },
        },
    )
}

module.exports = {
    sendEmail,
}
