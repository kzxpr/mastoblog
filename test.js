// BASED ON: https://www.tutorialspoint.com/crypto-createverify-method-in-node-js

const header = {
    connection: 'upgrade',
    host: 'dev2.hackademiet.dk',
    'x-forwarded-for': '161.97.83.113',
    'x-forwarded-proto': 'https',
    'content-length': '372',
    'user-agent': 'http.rb/5.1.0 (Mastodon/4.0.2; +https://todon.eu/)',
    date: 'Fri, 13 Jan 2023 10:49:03 GMT',
    'accept-encoding': 'gzip',
    digest: 'SHA-256=q7eOSxaPkrfpPvv3OQHD458bseC+ZpNHkeW/Gvv+gfw=',
    'content-type': 'application/activity+json',
    signature: 'keyId="https://todon.eu/users/kzxpr#main-key",algorithm="rsa-sha256",headers="(request-target) host date digest content-type",signature="OzqMKxm4njAKrUK6iBX31DcRosT2t6DY8Bd2WDQp8EpKvmjS/ED6HzTBoe22Y+7onEPKe5adwWM6pg2My6NF+kGdlgxR61unWEqWltUkJd3ojijiVM/7jVNz0Au6GupMAgQjXk4xBGAMQFGRXdtx3MBy8HPvtNgVgscWc30XP02bmLFT0uXrllqy5TIH59wBKtpKOndpH2L8Qg3DxJC0dOkzzDnQcxyqIdr1VhsHpKqSRLqls4Yd4uSUNB60a5RmqysyFCAZWK6Z9n8eUpsh064x30egrPPoO4pH+seFIr2HnNYJxm+CWUbEZoZjQMowW897lGDyfTMV7LOMTqnJng=="'
  }
const body = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: 'https://todon.eu/users/kzxpr#likes/756735/undo',
    type: 'Undo',
    actor: 'https://todon.eu/users/kzxpr',
    object: {
      id: 'https://todon.eu/users/kzxpr#likes/756735',
      type: 'Like',
      actor: 'https://todon.eu/users/kzxpr',
      object: 'https://dev2.hackademiet.dk/u/youonlylivetwice/statuses/3d03d7e0ff8f2d90929e5a4540b4aa0c'
    }
}

var crypto = require('crypto');

/* MAKE DIGEST */
const input = JSON.stringify(body);
const digest = crypto.createHash('sha256').update(input).digest('base64');

console.log("Received digest: q7eOSxaPkrfpPvv3OQHD458bseC+ZpNHkeW/Gvv+gfw=")

console.log("Calculated digest:", digest)

/* NOW CHECK THE SIGNATURE */
const algorithm = "RSA-SHA256";
//const key1 = "-----BEGIN PUBLIC KEY-----\n";
//const key2 = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1XJiq1YIpIbmpyh9nJjfqFTSrTfdLNe50B5bp7Uej1Dsl1fjzc1J834pCIfhicLKopWNHZKXjPnXKXBQeyxnaCH4xrO01v0kLYT31zpqDlNm6H7X4HtJJTGt/p1LorleZOHA3EAVIxvsViH1aJVHw43aXr4H1sE7lJCx729l/G1UbSWSRc0FNHa6EbGjeQQZ/OfWCycGLKvCYkcfZKl6qiIPJV6uE+N9fZiUdFieKsgtDExia3ZtXH/l/eHFrzlwfIxOrSDPiw6gMJOaBm6qRIBjtyelPUhnGpt26YZqmn7E/beTHNhNkzsfwxQB+ccPlxuJVqHUBGEE1Lj0hm3jGQIDAQAB";
//const key3 = "\n-----END PUBLIC KEY-----";
const publicKey = "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1XJiq1YIpIbmpyh9nJjf\nqFTSrTfdLNe50B5bp7Uej1Dsl1fjzc1J834pCIfhicLKopWNHZKXjPnXKXBQeyxn\naCH4xrO01v0kLYT31zpqDlNm6H7X4HtJJTGt/p1LorleZOHA3EAVIxvsViH1aJVH\nw43aXr4H1sE7lJCx729l/G1UbSWSRc0FNHa6EbGjeQQZ/OfWCycGLKvCYkcfZKl6\nqiIPJV6uE+N9fZiUdFieKsgtDExia3ZtXH/l/eHFrzlwfIxOrSDPiw6gMJOaBm6q\nRIBjtyelPUhnGpt26YZqmn7E/beTHNhNkzsfwxQB+ccPlxuJVqHUBGEE1Lj0hm3j\nGQIDAQAB\n-----END PUBLIC KEY-----";//key1 + key2 + key3;

const inbox = "/u/inbox";
const host = header.host; //"dev2.hackademiet.dk"
const date = header.date; //"Fri, 13 Jan 2023 10:49:03 GMT"
const contenttype = header['content-type']; //"application/activity+json"

// signature: headers="(request-target) host date digest content-type"
let data = "(request-target): host: "+host+"\ndate: "+date+"\ndigest: SHA-256="+digest+"\ncontent-type: "+contenttype;
// remove: post "+inbox+"\n

console.log(data)

//const signature = Buffer.from("OzqMKxm4njAKrUK6iBX31DcRosT2t6DY8Bd2WDQp8EpKvmjS/ED6HzTBoe22Y+7onEPKe5adwWM6pg2My6NF+kGdlgxR61unWEqWltUkJd3ojijiVM/7jVNz0Au6GupMAgQjXk4xBGAMQFGRXdtx3MBy8HPvtNgVgscWc30XP02bmLFT0uXrllqy5TIH59wBKtpKOndpH2L8Qg3DxJC0dOkzzDnQcxyqIdr1VhsHpKqSRLqls4Yd4uSUNB60a5RmqysyFCAZWK6Z9n8eUpsh064x30egrPPoO4pH+seFIr2HnNYJxm+CWUbEZoZjQMowW897lGDyfTMV7LOMTqnJng==", "base64")
const signature = "OzqMKxm4njAKrUK6iBX31DcRosT2t6DY8Bd2WDQp8EpKvmjS/ED6HzTBoe22Y+7onEPKe5adwWM6pg2My6NF+kGdlgxR61unWEqWltUkJd3ojijiVM/7jVNz0Au6GupMAgQjXk4xBGAMQFGRXdtx3MBy8HPvtNgVgscWc30XP02bmLFT0uXrllqy5TIH59wBKtpKOndpH2L8Qg3DxJC0dOkzzDnQcxyqIdr1VhsHpKqSRLqls4Yd4uSUNB60a5RmqysyFCAZWK6Z9n8eUpsh064x30egrPPoO4pH+seFIr2HnNYJxm+CWUbEZoZjQMowW897lGDyfTMV7LOMTqnJng==";

console.log(signature)

const verify = crypto.createVerify('sha256');
verify.write(data);
verify.end();

const isVerified = verify.verify(publicKey, signature);

//const isVerified = crypto.verify(algorithm, data, publicKey, signature);

console.log(isVerified);

// 'SHA-256=q7eOSxaPkrfpPvv3OQHD458bseC+ZpNHkeW/Gvv+gfw='



function verifySignature(header, body, publicKey) {
  console.log(publicKey)
  const { signature } = header;
  const signingString = `(request-target): ${header['(request-target)']}\nhost: ${header.host}\ndate: ${header.date}\ndigest: ${header.digest}\ncontent-type: ${header['content-type']}`;
  
  const signatureParams = signature.split(',').reduce((params, param) => {
    const [key, value] = param.split('=');
    params[key.trim()] = value.replace(/"/g, '').trim();
    return params;
  }, {});
  
  const signatureBuffer = Buffer.from(signatureParams.signature, 'base64');
  
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(signingString);
  
  const verified = verifier.verify(publicKey, signatureBuffer);
  
  if (verified) {
    console.log('Signature verified successfully');
  } else {
    console.log('Signature verification failed');
  }
}

verifySignature(header, body, publicKey);