const crypto = require('crypto');
const { signAndSend } = require("./signAndSend")
const { findInbox } = require("./addAccount")

async function sendAcceptMessage(thebody, local_uri, targetDomain) {
    const guid = crypto.randomBytes(16).toString('hex');
    console.log("ACCEPT ID", guid)
    let message = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      'id': `https://dev2.hackademiet.dk/${guid}`,
      'type': 'Accept',
      'actor': local_uri,
      'object': thebody,
    };
    let inbox = await findInbox(message.object.actor)
    //console.log("Resolved inbox", inbox)
    //let inbox = message.object.actor+'/inbox'; // HARD-CODED!!!
    await signAndSend(message, local_uri, targetDomain, inbox).then((data) => {
      console.log("SEND ACCEPT RESPONSE",data)
      return {msg: data}
    })
    .catch((err) => {
      return {err}
    })
  }

module.exports = sendAcceptMessage;