const crypto = require('crypto');
const { signAndSend } = require("./signAndSend")
const { findInbox } = require("./addAccount")

async function sendAcceptMessage(thebody, local_uri, targetDomain, domain) {
    const guid = crypto.randomBytes(16).toString('hex');
    let message = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      'id': "https://"+domain+"/accept/"+guid,
      'type': 'Accept',
      'actor': local_uri,
      'object': thebody,
    };
    let inbox = await findInbox(message.object.actor)
    await signAndSend(message, local_uri, targetDomain, inbox)
    .then((data) => {
      console.log("SENT ACCEPT ID", guid, "on", local_uri, data)
      return {msg: data}
    })
    .catch((err) => {
      return {err}
    })
  }

module.exports = { sendAcceptMessage }