const db = require("./../../../knexfile")
const knex = require("knex")(db)
const crypto = require('crypto');
const request = require('request');
const jwt = require('jsonwebtoken');

async function extractSignedData(signature, publicKey) {
  try {
    const decoded = jwt.verify(signature, publicKey, { algorithms: ['RS256'] });
    return decoded.signedData;
  } catch (err) {
    console.warn(err)
    // An error occurred while decoding the signature
    return null;
  }
}

async function verifyRsaSignature2017(signature, data, publicKey) {
  const what = await extractSignedData(signature, publicKey)
  console.log("WHAT", what)
  const sign = crypto.createVerify('RSA-SHA256');
  sign.update(data);
  return sign.verify(publicKey, signature, 'base64');
}

async function verifySignature(message, pubkey, signature, algorithm = "sha256"){
  console.log("VERIFY GOT ", message, pubkey, signature, algorithm)
  // Creating verify object with its algo
  //const verify = crypto.createVerify(algorithm);
  
  // Writing data to be signed and verified
  //verify.write(message);

  // Calling end method
  //verify.end();
  
  // Constructing public key
  //const publicKey = l1 + l2 + l3

  // Prints true if verified else false
  return await verifyRsaSignature2017(signature, message, pubkey)
  //return (verify.verify(pubkey, signature));
}

/*const getSignatureVerifyResult = (input) => {
  let signatureSignedByPrivateKey = getSignatureByInput(input)

  let pem = fs.readFileSync('PUBLIC_KEY_FILE_PATH_GOES_HERE')
  let publicKey = pem.toString('ascii')
  const verifier = crypto.createVerify('RSA-SHA256')

  verifier.update(input, 'ascii')

  const publicKeyBuf = new Buffer(publicKey, 'ascii')
  const signatureBuf = new Buffer(signatureSignedByPrivateKey, 'hex')
  const result = verifier.verify(publicKeyBuf, signatureBuf)

  return result;
}*/

async function signAndSend(message, local_uri, targetDomain, inbox, apikey) { 
  return new Promise(async (resolve, reject) => {
    // get the URI of the actor object and append 'inbox' to it
    let inboxFragment = inbox.replace('https://'+targetDomain,''); // HARD-CODED
    //console.log("FRAG", inboxFragment)

    // get the private key
    const result = await knex("apaccounts").where("uri", "=", local_uri).andWhere("apikey", "=", apikey).select("privkey").first();
    if (result === undefined) {
      reject("No account found for "+local_uri);
    } else {
      //console.log("FOUND PRIVKEY")
      let privkey = result.privkey;
      const digestHash = crypto.createHash('sha256').update(JSON.stringify(message)).digest('base64');
      const signer = crypto.createSign('sha256');
      let d = new Date();
      let stringToSign = `(request-target): post ${inboxFragment}\nhost: ${targetDomain}\ndate: ${d.toUTCString()}\ndigest: SHA-256=${digestHash}`;
      signer.update(stringToSign);
      signer.end();
      const signature = signer.sign(privkey);
      const signature_b64 = signature.toString('base64');
      let header = 'keyId="'+local_uri+'",headers="(request-target) host date digest",signature="'+signature_b64+'"';
      //console.log("TARGET",targetDomain)
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
        } else {
          //console.log("OK")
          resolve('Message received on target server!');
        }
      })
    }
    })
  }

  module.exports = { signAndSend, verifySignature };