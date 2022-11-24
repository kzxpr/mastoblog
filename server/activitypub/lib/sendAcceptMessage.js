const crypto = require('crypto');
const signAndSend = require("./signAndSend")

async function sendAcceptMessage(thebody, name, domain, targetDomain) {
    const guid = crypto.randomBytes(16).toString('hex');
    let message = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      'id': `https://${domain}/${guid}`,
      'type': 'Accept',
      'actor': `https://${domain}/u/${name}`,
      'object': thebody,
    };
    let inbox = message.object.actor+'/inbox';
    await signAndSend(message, name, domain, targetDomain, inbox).then((data) => {
      console.log("SEND ACCEPT RESPONSE",data)
      return {msg: data}
    })
    .catch((err) => {
      return {err}
    })
  }

module.exports = sendAcceptMessage;