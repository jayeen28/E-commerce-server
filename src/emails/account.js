const { transport } = require('./transport');

const sendWelcomeEmail = async (email, name) => {
    try {
        await transport.sendMail({
            to: email,
            from: 'no-reply@email.com',
            subject: 'Thanks for joining in!',
            text: `Welcome to the app, ${name}. Please contact your superior to activate your account.`
        });
        return true;
    } catch (e) {
        return false;
    }
}

module.exports = {
    sendWelcomeEmail
}