const { EmailSenderLib } = require('../lib/EmailService/EmailSender')
const { UsersLib } = require('../lib/Users')

async function onSignup(actorUserId) {
    const users = new UsersLib()

    const user = await users.getActiveUserById(actorUserId)

    const email = new EmailSenderLib('signup', 'Welcome to Houselist!')
    await email.send(user.name, user.email_address)
}

module.exports = {
    onSignup,
}
