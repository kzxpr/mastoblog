'use strict';
const express = require('express'),
      router = express.Router();

const db = require("./../../knexfile")
const knex = require("knex")(db)

const { createActor } = require("./lib/createActor")
const { createNote } = require("./lib/createNote")
const { wrapInCreate } = require("./lib/wrapInCreate")
const { signAndSend } = require("./lib/signAndSend")
const { makeMessage } = require("./lib/makeMessage")

router.post('/createPost', async function (req, res) {
    // pass in a name for an account, if the account doesn't exist, create it!
    const { username, content, cc } = req.body;
    let domain = req.app.get('domain');
    const type = "Note";
    console.log("createPost:", username, content)
    var followers = new Array();
    if(cc){
        console.log("Using follower", cc)
        followers.push(cc)
    }
    const note_in_db = await createNote(content, username, domain)
    .then(async (note_id) => {
        console.log("A NOTE",note_id[0])
        const messages = await knex("apmessages").where("id", note_id[0]).first()
        .then(async(message) => {
            console.log("M", message)
            if(message){
                
                const msg = makeMessage(username, domain, message.guid, message.publishedAt, message.content);
                console.log("MSG", msg)
                const wrapped = wrapInCreate(msg, username, domain, cc)
                console.log("Message wrapped", wrapped);
                for(let follower of followers){
                    let inbox = follower+'/inbox';
                    let myURL = new URL(follower);
                    let targetDomain = myURL.hostname;
                    await signAndSend(wrapped, username, domain, targetDomain, inbox)
                    .then((data) => {
                        console.log("SEND NOTE RESPONSE",data)
                    })
                    .catch((err) => {
                        return {err}
                    })
                }
            }else{
                res.sendStatus(404)
            }
            res.send("OK")
        })
        .catch((e) => {
            console.error(e)
            res.sendStatus(500)
        })
        //await sendNote(message, acct, domain, row.follower)
        //.then(())
        
    })
    .catch((e) => {
        console.error(e)
        res.sendStatus(500)
    })
});

router.get('/createActor', async function (req, res) {
    // pass in a name for an account, if the account doesn't exist, create it!
    const username = req.query.username;
    console.log("createActor:", username)
    await createActor(username)
        .then(async (account) => {
            await knex("apaccounts").insert({
                ...account,
                createdAt: knex.fn.now()
            })
            .then(() => {
                res.status(200).json({ msg: 'ok' })
            })
            .catch((e) => {
                console.error("ERROR in /admin/createActor", e)
                res.status(500).json({ msg: "Error adding to database"})
            })
        })
        .catch((e) => {
            res.status(e.statusCode).json({ msg: e.msg })
        })
});

module.exports = router;