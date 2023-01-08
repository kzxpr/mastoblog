const db = require("./../../../knexfile")
const knex = require("knex")(db)

const { signAndSend } = require("./signAndSend")
const { makeMessage } = require("./makeMessage")
const { wrapInCreate } = require("./wrappers")
const { findInbox } = require("./addAccount")

async function sendLatestMessages(follower, user_uri){
    return new Promise(async(resolve, reject) => {
        await knex("apmessages").where("attributedTo", user_uri).limit(10)
        .then(async(messages) => {
            console.log("Found latestMessages:", messages.length)
            for(let message of messages){
                const msg = makeMessage(user_uri, message.guid, { url: message.uri, published: message.publishedAt, content: message.content, cc: follower });
                const wrapped = wrapInCreate(msg, user_uri, follower)
                let inbox = await findInbox(follower)
                let myURL = new URL(follower);
                let targetDomain = myURL.hostname;
                await signAndSend(wrapped, user_uri, targetDomain, inbox)
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