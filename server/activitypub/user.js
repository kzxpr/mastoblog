'use strict';
const express = require('express'),
    crypto = require('crypto'),
    router = express.Router();

const db = require("./../../knexfile")
const knex = require("knex")(db)
const clc = require('cli-color');

const { loadActorByUsername } = require("./lib/loadActorByUsername")
const { loadFollowersByUri, loadFollowingByUri } = require("./lib/loadFollowersByUsername")
const { makeMessage } = require("./lib/makeMessage");
const { wrapInCreate } = require('./lib/wrappers');
const { sendAcceptMessage } = require("./lib/sendAcceptMessage")
const { verifySignature } = require("./lib/signAndSend")
const { sendLatestMessages } = require("./lib/sendLatestMessages")
const { addFollower } = require("./lib/addFollower")
const { lookupAccountByURI } = require("./lib/addAccount")

const { startAPLog, endAPLog } = require("./lib/aplog");
const { addMessage } = require('./lib/addMessage');

router.get('/:username', async function (req, res) {
    const aplog = await startAPLog(req)
    let name = req.params.username;
    let domain = req.app.get('domain');
    if (!name) {
        await endAPLog(aplog, "No username provided", 404)
        return res.status(404);
    } else {
        loadActorByUsername(name, domain)
        .then(async(data) => {
            await endAPLog(aplog, data);
            res.json(data);
        })
        .catch(async(err) => {
            await endAPLog(aplog, err.msg, err.statuscode)
            res.status(err.statuscode).send("Error at /u/"+name+": "+err.msg)
        })
    }
});

router.get('/:username/profile', async function (req, res) {
    //const aplog = await startAPLog(req)
    let name = req.params.username;
    let domain = req.app.get('domain');
    if (!name) {
        //await endAPLog(aplog, "No username provided", 404)
        res.status(404);
    } else {
        await knex("apaccounts").where("handle", "=", username+"@"+domain)
        .then(async(data) => {
            //await endAPLog(aplog, data);
            res.send("Welcome to "+name+"'s profile!")
        })
        .catch(async(err) => {
            //await endAPLog(aplog, err.msg, err.statuscode)
            res.status(err.statuscode).send("Error at /u/"+name+"/profile: "+err.msg)
        })
    }
});


router.get('/:username/followers', async function (req, res) {
    const aplog = await startAPLog(req)
    let username = req.params.username;
    let domain = req.app.get('domain');
    
    const uri = await knex("apaccounts").where("handle", "=", username+"@"+domain).first()
        .then((account) => {
            return account.uri;
        })
        .catch(async(e) => {
            console.error(e)
            await endAPLog(aplog, "Username not found", 400)
            return res.status(400).send('Bad request.');
        })
        
        loadFollowersByUri(uri)
        .then(async (followersCollection) => {
            await endAPLog(aplog, followersCollection)
            res.json(followersCollection);
        })
        .catch(async(e) => {
            await endAPLog(aplog, e, 500)
            res.statusCode(500);
        });
    
});

router.get('/:username/following', async function (req, res) {
    const aplog = await startAPLog(req)
    let username = req.params.username;
    let domain = req.app.get('domain');
    
    const uri = await knex("apaccounts").where("handle", "=", username+"@"+domain).first()
        .then((account) => {
            return account.uri;
        })
        .catch(async(e) => {
            console.error(e)
            await endAPLog(aplog, "Username not found", 400)
            return res.status(400).send('Bad request.');
        })
        
        loadFollowingByUri(uri)
        .then(async (followersCollection) => {
            await endAPLog(aplog, followersCollection)
            res.json(followersCollection);
        })
        .catch(async(e) => {
            await endAPLog(aplog, e, 500)
            res.statusCode(500);
        });
    
});

router.get("/:username/messages/:messageid", async(req, res) => {
    const aplog = await startAPLog(req)
    const { username, messageid } = req.params;
    const domain = req.app.get('domain');
    if(!messageid){
        res.sendStatus(400)
        await endAPLog(aplog, "No message id", 400)
    }else{
        const message = await knex("apmessages").where("guid", "=", "https://"+domain+"/u/"+username+"/statuses/"+messageid).first()
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
        const wrapped = wrapInCreate(m, username+"@"+domain, domain, [], message.guid)
        await endAPLog(aplog, wrapped)
        res.send(wrapped);
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
            "first": "https://"+domain+"/u/"+username+"/outbox?page=true"
        })
    }else{*/
        const user_uri = await knex("apaccounts").where("handle", "=", username+"@"+domain).select("uri").first()
            .then((d) => { return d.uri })
            .catch((e) => { res.sendStatus(500)})
        const messages = await knex("apmessages").where("attributedTo", user_uri)
        .then((messages) => {
            var output = new Array();
            for(let message of messages){
                output.push(makeMessage(username, domain, message.guid, message.publishedAt, message.content))
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
    const user_uri = await knex("apaccounts").where("handle", "=", username+"@"+domain).select("uri").first()
        .then((d) => { return d.uri })
        .catch((e) => { res.sendStatus(500)})
    const messages = await knex("apmessages").where("attributedTo", user_uri).andWhere("pinned", "=", 1)
    .then((messages) => {
        var output = new Array();
        for(let message of messages){
            output.push(makeMessage(user_uri, message.guid, { published: message.publishedAt, content: message.content }));
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
    const uri = "https://"+domain+"/u/"+username+"/statuses/"+messageid;
    const messages = await knex("apmessages").where("uri", "=", uri).first()
        .then(async (message) => {
            console.log("M", uri, message)
            if(message){
                const msg = makeMessage(uri, message.guid, {publishedAt: message.publishedAt, content: message.content});
                
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

router.post(['/inbox', '/:username/inbox'], async function (req, res) {
    const aplog = await startAPLog(req)
    const username = req.params.username || "!shared!";
    // pass in a name for an account, if the account doesn't exist, create it!
    let domain = req.app.get('domain');
    const myURL = new URL(req.body.actor);
    let targetDomain = myURL.hostname;
    // TODO: add "Undo" follow event
    const reqtype = req.body.type;

    console.log("POST", clc.blue("/inbox"), "to "+username+" ("+reqtype+") from "+req.body.actor)
    
    const sender = await knex("apaccounts").where("uri", "=", req.body.actor)
        .then((rows) => {
            if(rows.length==1){
                return rows[0]
            }else{
                console.warn("Ingen ACTOR in apaccounts...", req.body.actor)
                return {};
            }
        })
    
    if(reqtype === 'Create'){
        const objtype = req.body.object.type;
        if(objtype==="Note"){
            await addMessage(req.body.object)
            .then((d) => {
                console.log("I created a note saying",req.body.object.content)
            })
            .catch((e) => {
                console.error("ERROR in /inbox", e)
            })
            /*if(sender){
                const objwithoutsignature = Object.keys(req.body)
                    .filter(key => key !== 'signature')
                    .reduce((obj, key) => {
                        obj[key] = req.body[key];
                        return obj;
                    }, {}
                );
                
                const test = JSON.stringify(req.body) + req.body.signature.nonce;
                const checkSignature = await verifySignature(test, sender.pubkey, req.body.signature.signatureValue)
                console.log("VERIFY SIGNATURE", checkSignature)
            }*/
            await endAPLog(aplog, "Received note", 201)
            res.sendStatus(201)
        }else if(objtype==="Article"){
            console.log("I got a article saying",req.body.object.content)
            addMessage(req.body.object)
            await endAPLog(aplog, "Received article", 201)
            res.sendStatus(201)
        }else{
            await endAPLog(aplog, "Received create, but object type wasn't recognized", 500)
            console.warn("RECEIVED", objtype)
            res.sendStatus(500)
        }
    }else if(reqtype == 'Follow'){
        if(typeof req.body.object === 'string'){
            const local_uri = req.body.object;
            await knex("apaccounts").where("uri", "=", local_uri).first()
            .then(async(account) => {
                if(account){
                    const follower_uri = req.body.actor;
                    await lookupAccountByURI(follower_uri)
                        .then(async(follower_account) => {

                            await addFollower(local_uri, follower_uri)
                            await sendAcceptMessage(req.body, local_uri, targetDomain, domain)
                            await sendLatestMessages(follower_uri, local_uri)
                            .then(async(d) => {
                                await endAPLog(aplog, "Pinned messages were sent to new follower: "+follower_uri)
                                res.sendStatus(200)
                            })
                            .catch(async(e) => {
                                console.error("ERROR in sendLatestMessages", e)
                                await endAPLog(aplog, "ERROR in sendLatestMessages", 500)
                                res.sendStatus(500)
                            })
                        })
                        .catch((err) => {
                            console.error(err)
                            console.error("ERROR doing lookupAccountByURI", follower_uri)
                            res.sendStatus(500)
                        })
                }else{
                    res.sendStatus(404)
                }
            });
        }else{
            console.error("I got a follow request I can't handle because object is not a string!", req.body.object)
            res.sendStatus(500)
        }
    }else{
        await endAPLog(aplog, "REQ type is not recognized...", 500)
        res.sendStatus(500)
    }
});

router.get("*", async(req, res) => {
    //const aplog = await startAPLog(req)
    //await endAPLog(aplog, "", 404)
    res.sendStatus(404)
})

router.post("*", async(req, res) => {
    //const aplog = await startAPLog(req)
    //await endAPLog(aplog, "", 404)
    res.sendStatus(404)
})

module.exports = router;