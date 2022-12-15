const db = require("./../../../knexfile")
const knex = require("knex")(db)

const { signAndSend } = require("./signAndSend")
const { makeMessage } = require("./makeMessage")
const { wrapInCreate } = require("./wrapInCreate")

async function sendLatestMessages(follower, username, domain){
    return new Promise(async(resolve, reject) => {
        await knex("apmessages").where("attributedTo", "@"+username+"@"+domain).limit(10)
        .then(async(messages) => {
            for(let message of messages){
                const msg = makeMessage(username, domain, message.guid, message.publishedAt, message.content);
                const wrapped = wrapInCreate(msg, username, domain, follower)
                    let inbox = follower+'/inbox';
                    let myURL = new URL(follower);
                    let targetDomain = myURL.hostname;
                    await signAndSend(wrapped, username, domain, targetDomain, inbox)
                    .then((data) => {
                        console.log("SEND NOTE RESPONSE",data)
                    })
                    .catch((err) => {
                        reject({err})
                    })
                
            }
            resolve("OK")
        })
        .catch((e) => {
            console.error(e)
            reject(e)
        })
    })
}

module.exports = { sendLatestMessages }