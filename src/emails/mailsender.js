const { transport } = require('./transport');

/**
 * Sends Email
 * @param {receiver, subject, body, type} MessageObject
 * @returns
 */
const sendMail = async ({ receiver, subject, body, type }) => {
  var mailObject = {
    to: receiver,
    from: {
      name: 'Core Devs',
      address: 'no-reply@email.com'
    },
    subject,
  }

  if (type === 'text') {
    mailObject.text = body;
  }
  else if (type === 'html') {
    mailObject.html = body;
  }

  // Mail Sender
  try {
    await transport.sendMail(mailObject);
    return true;
  } catch (e) {
    return e;
  }
};

module.exports = {
  sendMail,
};