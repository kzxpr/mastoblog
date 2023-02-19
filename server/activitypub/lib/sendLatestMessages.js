const db = require("./../../../knexfile")
const knex = require("knex")(db)

const { signAndSend } = require("./signAndSend")
const { makeMessage } = require("./makeMessage")
const { wrapInCreate } = require("./wrappers")
const { findInbox } = require("./addAccount")

async function sendLatestMessages(follower, user_uri){
    return new Promise(async(resolve, reject) => {
        await knex("apmessages").where("attributedTo", user_uri)
        .andWhere(function(){
            this.where("public", "=", 1).orWhere("followshare", "=", 1)
        })
        .limit(10)
        .then(async(messages) => {
            console.log("Found latestMessages:", messages.length)
            for(let message of messages){
                const msg = makeMessage(user_uri, message.guid, { url: message.uri, published: message.publishedAt, content: message.content, cc: follower });
                const wrapped = wrapInCreate(msg, user_uri, follower)
                let inbox = await findInbox(follower)
                let myURL = new URL(follower);
                let targetDomain = myURL.hostname;
                const account = await knex("apaccounts").where("uri", "=", local_uri).select("apikey").first();
                const apikey = account.apikey;
                await signAndSend(wrapped, user_uri, targetDomain, inbox, apikey)
                .then((data) => {
                    console.log("SEND LATEST NOTE RESPONSE",data)
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