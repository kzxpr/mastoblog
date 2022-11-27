'use strict';
const express = require('express'),
      crypto = require('crypto'),
      request = require('request'),
      router = express.Router();

const db = require("./../../knexfile")
const knex = require("knex")(db)

const { startAPLog, endAPLog } = require("./lib/aplog")

const sendAcceptMessage = require("./lib/sendAcceptMessage")
const parseJSON = require("./lib/parseJSON")
const { makeMessage } = require("./lib/makeMessage")
const { signAndSend } = require("./lib/signAndSend")
const { wrapInCreate } = require("./lib/wrapInCreate");
const { sendLatestMessages } = require("./lib/sendLatestMessages")
const { addFollower } = require("./lib/addFollower")

router.post('/', async function (req, res) {
    const aplog = await startAPLog(req)
    // pass in a name for an account, if the account doesn't exist, create it!
    let domain = req.app.get('domain');
    const myURL = new URL(req.body.actor);
    let targetDomain = myURL.hostname;
    console.log("INBOX",targetDomain)
    // TODO: add "Undo" follow event
    
    const reqtype = req.body.type;
    console.log("Reqtype",reqtype)
    
    if (typeof req.body.object === 'string'){
        let local_username = req.body.object.replace(`https://${domain}/u/`,'');
        //const username = name;//+"@"+domain;

        const user_id = await knex("apaccounts").where("username", "=", local_username).first()
        .then((account) => {
            return account.id
        })

        if(reqtype === 'Follow') {  
            await sendAcceptMessage(req.body, local_username, domain, targetDomain);
            const follower = req.body.actor;
            //console.log("FOLLOW MED",req.body, local_username, domain, targetDomain)
            await endAPLog(aplog, { local_username, domain, targetDomain })
            await addFollower(local_username, follower)
            await sendLatestMessages(follower, user_id, local_username, domain)
            .then((d) => {
                console.log("Pinned messages were sent to new follower: "+follower)
            })
            .catch((e) => {
                console.error("ERROR in sendLatestMessages", e)
            })
        }
    }else{
        if(reqtype === 'Create'){
            const objtype = req.body.object.type;
            console.log("Objtype",objtype)
            if(objtype==="Note"){
                console.log("I got a note saying",req.body.object.content)
                await endAPLog(aplog, "Received note")
            }
        }
    }
    console.log("**************************************")
});

module.exports = router;