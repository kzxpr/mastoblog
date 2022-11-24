'use strict';
const crypto = require('crypto');
const createWebfinger = require("./createWebfinger")

async function createActor(username){
    return new Promise(async (resolve, reject) => {
        if(username===undefined){
            reject({statusCode: 400, msg: 'Bad request. Please make sure "account" is a property in the POST body.'});
        }else if(username.trim()==""){
            reject({statusCode: 400, msg: 'Bad request. Username MUST have characters!.'});
        }else{
            // create keypair
            crypto.generateKeyPair('rsa', {
                modulusLength: 4096,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem'
                }
            }, async (err, publicKey, privateKey) => {
                if(err){
                    reject({ statusCode: 500, msg: err})
                }else{
                    //let webfingerRecord = createWebfinger(username, domain);
                    const apikey = crypto.randomBytes(16).toString('hex');
                    resolve({
                        username,
                        apikey,
                        pubkey: publicKey,
                        privkey: privateKey
                    })
                }
            })
        }
    })
}

module.exports = { createActor }