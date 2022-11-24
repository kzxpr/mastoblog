'use strict';
const express = require('express'),
      crypto = require('crypto'),
      request = require('request'),
      router = express.Router();

const db = require("./../../knexfile")
const knex = require("knex")(db)

const sendAcceptMessage = require("./lib/sendAcceptMessage")
const parseJSON = require("./lib/parseJSON")

async function addFollower(username, follower){
    // Add the user to the DB of accounts that follow the account
    // get the followers JSON for the user
    // Check if user exists
    
    const result = await knex("apaccounts").where("name", "=", username).select("name").first();
    if (result === undefined) {
        console.log(`No record found for ${username}.`);
    } else {
        // update followers
        console.log("Add follower",follower)
        try {
            // update into DB
            const guid = crypto.randomBytes(16).toString('hex');
            let newFollowers = await knex("apfollowers").insert({"guid": guid, user: username, "follower": follower, createdAt: knex.fn.now() })
            .onConflict(['user', 'follower'])
            .ignore()
        } catch(e) {
            console.log('error', e);
        }
    }
}

router.post('/', async function (req, res) {
    console.log("INBOX",req.body)
    // pass in a name for an account, if the account doesn't exist, create it!
    let domain = req.app.get('domain');
    const myURL = new URL(req.body.actor);
    let targetDomain = myURL.hostname;
    console.log("INBOX",targetDomain)
    // TODO: add "Undo" follow event
    
    const reqtype = req.body.type;
    console.log("Reqtype",reqtype)
    
    if (typeof req.body.object === 'string'){
        let name = req.body.object.replace(`https://${domain}/u/`,'');
        const username = name+"@"+domain;

        if(reqtype === 'Follow') {  
            await sendAcceptMessage(req.body, name, domain, targetDomain);
            const follower = req.body.actor;
            console.log("FOLLOW MED",req.body, name, domain, targetDomain)
            await addFollower(username, follower)
        }
    }else{
        if(reqtype === 'Create'){
            const objtype = req.body.object.type;
            console.log("Objtype",objtype)
            if(objtype==="Note"){
                console.log("I got a note saying",req.body.object.content)
            }
        }
    }
    console.log("**************************************")
});

module.exports = router;