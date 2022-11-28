'use strict';
const express = require('express'),
    crypto = require('crypto'),
    router = express.Router();

const db = require("./../../knexfile")
const knex = require("knex")(db)

const { loadActorByUsername } = require("./lib/loadActorByUsername")
const { loadFollowersByUsername } = require("./lib/loadFollowersByUsername")
const { makeMessage } = require("./lib/makeMessage");
const { wrapInCreate } = require('./lib/wrapInCreate');
const sendAcceptMessage = require("./lib/sendAcceptMessage")
const parseJSON = require("./lib/parseJSON")
const { signAndSend } = require("./lib/signAndSend")
const { sendLatestMessages } = require("./lib/sendLatestMessages")
const { addFollower } = require("./lib/addFollower")

const { startAPLog, endAPLog } = require("./lib/aplog")

router.get('/:username', async function (req, res) {
    const aplog = await startAPLog(req)
    //console.log("REQ", req)
    let name = req.params.username;
    let domain = req.app.get('domain');
    if (!name) {
        await endAPLog(aplog, "Username not found", 400)
        return res.status(400).send('Bad request.');
    } else {
        loadActorByUsername(name, domain)
        .then(async(data) => {
            await endAPLog(aplog, data);
            res.json(data);
        })
        .catch(async(err) => {
            await endAPLog(aplog, err, err.statusCode)
            res.status(err.statuscode).send("Error at /u/"+name+": "+err.msg)
        })
    }
});

router.get('/:username/followers', async function (req, res) {
    const aplog = await startAPLog(req)
    let username = req.params.username;
    if (!username) {
        await endAPLog(aplog, "Username not found", 400)
        return res.status(400).send('Bad request.');
    } else {
        let domain = req.app.get('domain');
        loadFollowersByUsername(username, domain)
        .then(async (followersCollection) => {
            await endAPLog(aplog, followersCollection)
            res.json(followersCollection);
        })
        .catch(async(e) => {
            await endAPLog(aplog, e, 500)
            res.statusCode(500);
        });
    }
});

router.get("/:username/messages/:messageid", async(req, res) => {
    const aplog = await startAPLog(req)
    const { username, messageid } = req.params;
    const domain = req.app.get('domain');
    if(!messageid){
        res.sendStatus(400)
        await endAPLog(aplog, "No message id", 400)
    }else{
        const message = await knex("apmessages").where("guid", "=", messageid).first()
        .then(async(m) => {
            if(m){
                return m;
            }else{
                await endAPLog(aplog, "No message found for ID "+messageid, 400)
                res.sendStatus(400)
            }
        })
        .catch(async (e) => {
            console.error(e)
            await endAPLog(aplog, e, 500)
            res.sendStatus(500)
        })
        let m = makeMessage(username, domain, message.guid, message.publishedAt, message.content);
        await endAPLog(aplog, m)
        res.send(m);
    }    
})

router.post("/:username/outbox", async (req, res) => {
    const aplog = await startAPLog(req)
    console.log("TRIGGER post on /outbox", req.body)
    await endAPLog(aplog, "ok")
    res.send("OK")
})

router.get(["/:username/outbox"], async(req, res) => {
    const aplog = await startAPLog(req)
    const { username } = req.params;
    const { page } = req.query;
    const domain = req.app.get('domain');
    const content = new Array("https://www.w3.org/ns/activitystreams")
    /*if(!page){
        res.json({
            "@context": "https://www.w3.org/ns/activitystreams",
            "id": "https://"+domain+"/u/"+username+"/outbox",
            "type": "OrderedCollection",
            "first": "https://"+domain+"/u/"+username+"/outbox?page=true"
        })
    }else{*/
        const user_id = await knex("apaccounts").where("username", "=", username).select("id").first().then((d) => { return d.id }).catch((e) => { res.sendStatus(500)})
        const messages = await knex("apmessages").where("attributedTo", user_id)
        .then((messages) => {
            var output = new Array();
            for(let message of messages){
                output.push(makeMessage(username, domain, message.guid, message.publishedAt, message.content))
                //output.push(wrapInCreate(makeMessage(username, domain, message.guid, message.publishedAt, message.content), username, domain, ""))
            }
            return output;
        })
        const data = {
            "@content": content,
            "id": "https://"+domain+"/u/"+username+"/outbox",
            "type": "OrderedCollection",
            "totalItems": messages.length,
            "orderedItems": messages
        }
        await endAPLog(aplog, data)
        res.json(data)
        /*res.json({
            "id": "https://"+domain+"/u/"+username+"/outbox",
            "type": "OrderedCollectionPage",
            
            "partOf": "https://"+domain+"/u/"+username+"/outbox",
            "first": {
                "orderedItems": messages
            }
        })
        /* "next": "https://"+domain+"/u/"+username+"/outbox?max_id=01FJC1Q0E3SSQR59TD2M1KP4V8&page=true",
            "prev": "https://"+domain+"/u/"+username+"/outbox?min_id=01FJC1Q0E3SSQR59TD2M1KP4V8&page=true", */
    //}
    
})

router.get(["/:username/collections/featured"], async(req, res) => {
    // MASTODON = https://todon.eu/users/kzxpr/collections/featured
    const aplog = await startAPLog(req)
    const { username } = req.params;
    const { page } = req.query;
    const domain = req.app.get('domain');
    const context = new Array("https://www.w3.org/ns/activitystreams")
        const user_id = await knex("apaccounts").where("username", "=", username).select("id").first().then((d) => { return d.id }).catch((e) => { res.sendStatus(500)})
        const messages = await knex("apmessages").where("attributedTo", user_id).andWhere("pinned", "=", 1)
        .then((messages) => {
            var output = new Array();
            for(let message of messages){
                //console.log("TRYING IN 'create'")
                //output.push(wrapInCreate(makeMessage(username, domain, message.guid, message.publishedAt, message.content), username, domain, "", message.guid))
                output.push(makeMessage(username, domain, message.guid, message.publishedAt, message.content));
            }
            return output;
        })
            
        // type = OrderedCollection vs OrderedCollectionPage
        const data = {
            "@context": context,
            "id": "https://"+domain+"/u/"+username+"/collections/featured",
            "type": "OrderedCollection",
            "totalItems": messages.length,
            "orderedItems": messages
        }
        await endAPLog(aplog, data)
        res.json(data)
    
})

router.get("/:username/statuses/:messageid", async (req, res) => {
    const aplog = await startAPLog(req)
    const { username, messageid } = req.params;
    const domain = req.app.get('domain');
    const context = new Array("https://www.w3.org/ns/activitystreams")
    const user_id = await knex("apaccounts").where("username", "=", username).select("id").first().then((d) => { return d.id }).catch((e) => { res.sendStatus(500)})
    const messages = await knex("apmessages").where("guid", messageid).first()
        .then(async (message) => {
            //console.log("M", message)
            if(message){
                const msg = makeMessage(username, domain, message.guid, message.publishedAt, message.content);
                
                /* IT SEEMS LIKE THIS SHOULD *NOT* BE WRAPPED */

                await endAPLog(aplog, msg)
                res.json(msg)
            }else{
                await endAPLog(aplog, "The message you requested doesn't exist", 404)
                res.sendStatus(404)
            }
        })
        .catch(async(e) => {
            console.error(e)
            await endAPLog(aplog, e, 500)
            res.sendStatus(500)
        })
})

router.get("/:username/inbox", async(req, res) => {
    console.log("TRIGGER get /inbox")
    res.sendStatus(404)
})

router.post('/:username/inbox', async function (req, res) {
    const aplog = await startAPLog(req)
    // pass in a name for an account, if the account doesn't exist, create it!
    let domain = req.app.get('domain');
    const myURL = new URL(req.body.actor);
    let targetDomain = myURL.hostname;
    //console.log("INBOX",targetDomain)
    // TODO: add "Undo" follow event
    
    const reqtype = req.body.type;
    //console.log("Reqtype",reqtype)
    
    if (typeof req.body.object === 'string'){
        let local_username = req.body.object.replace(`https://${domain}/u/`,'');
        //const username = name;//+"@"+domain;

        await knex("apaccounts").where("username", "=", local_username).first()
        .then(async(account) => {
            if(account){
                user_id = account.id
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
                    .catch(async(e) => {
                        console.error("ERROR in sendLatestMessages", e)
                        await endAPLog(aplog, "Received note", 500)
                        res.sendStatus(500)
                    })
                }else{
                    await endAPLog(aplog, "Not found", 404)
                    res.sendStatus(404)
                }
            }else{
                res.sendStatus(500)
            }
            
        })

        
    }else{
        if(reqtype === 'Create'){
            const objtype = req.body.object.type;
            console.log("Objtype",objtype)
            if(objtype==="Note"){
                console.log("I got a note saying",req.body.object.content)
                await endAPLog(aplog, "Received note", 201)
                res.sendStatus(201)
            }
        }else{
            await endAPLog(aplog, "Not found", 404)
            res.sendStatus(404)
        }
    }
    //console.log("**************************************")
});

router.get("*", async(req, res) => {
    const aplog = await startAPLog(req)
    await endAPLog(aplog, "", 404)
    res.sendStatus(404)
})

router.post("*", async(req, res) => {
    const aplog = await startAPLog(req)
    await endAPLog(aplog, "", 404)
    res.sendStatus(404)
})

module.exports = router;