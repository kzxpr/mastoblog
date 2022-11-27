const db = require("./../../../knexfile")
const knex = require("knex")(db)
const crypto = require('crypto');
const request = require('request');

async function signAndSend(message, name, domain, targetDomain, inbox) { 
  console.log("RUN signAndSend")
  return new Promise(async (resolve, reject) => {
    // get the URI of the actor object and append 'inbox' to it
    //let inbox = message.object.actor+'/inbox';
    let inboxFragment = inbox.replace('https://'+targetDomain,'');
    // get the private key
    //let db = req.app.get('db');
    //let result = db.prepare('select privkey from accounts where name = ?').get(`${name}@${domain}`);
    const domain_raw = domain.split("/")[0]
    const result = await knex("apaccounts").where("username", "=", name).orWhere("username", "=", name+"@"+domain).select("privkey").first();
    if (result === undefined) {
      reject("No record found for "+name);
    }
    else {
      console.log("FOUND PRIVKEY")
      let privkey = result.privkey;
      const digestHash = crypto.createHash('sha256').update(JSON.stringify(message)).digest('base64');
      const signer = crypto.createSign('sha256');
      let d = new Date();
      let stringToSign = `(request-target): post ${inboxFragment}\nhost: ${targetDomain}\ndate: ${d.toUTCString()}\ndigest: SHA-256=${digestHash}`;
      signer.update(stringToSign);
      signer.end();
      const signature = signer.sign(privkey);
      const signature_b64 = signature.toString('base64');
      const username = name.split("@")[0]
      let header = `keyId="https://${domain}/u/${username}",headers="(request-target) host date digest",signature="${signature_b64}"`;
      console.log("TARGET",targetDomain)
      await request(inbox, {
        headers: {
          'Host': targetDomain,
          'Date': d.toUTCString(),
          'Digest': `SHA-256=${digestHash}`,
          'Signature': header
        },
        method: 'POST',
        json: true,
        body: message
      }, (error, response, body) => {
        if (error) {
          console.error("ERR",error)
          reject('Error:'+error);
        }
        else {
          console.log("OK")
          resolve('Response: OK');
        }
      })
    }
    })
  }

  module.exports = { signAndSend };