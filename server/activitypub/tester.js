const express = require('express'),
      router = express.Router();

const { createActor } = require("./lib/createActor")
const { createNote, createPage, createArticle } = require("./lib/createNote")
const { wrapInCreate, wrapInUpdate } = require("./lib/wrapInCreate")
const { signAndSend } = require("./lib/signAndSend")
const { makeMessage, makePage, makeArticle } = require("./lib/makeMessage")

router.get("/", (req, res) => {
    res.send("Hi, let's test stuff!")
})

router.get("/:username", (req, res) => {
    const { username } = req.params;
    var body = "Hi "+username+".<br>";
    body += "What should we do?"
    const options = ["create", "update", "undo"]
    body += "<ul>"
    for(let option of options){
        body += "<li><a href='/ap/admin/tester/"+username+"/"+option+"'>"+option+"</a></li>"
    }
    body += "</ul>"
    res.send(body)
})

router.get("/:username/:activity", (req, res) => {
    const domain = req.app.get('domain');
    const { username, activity } = req.params;
    var body = "Hi "+req.params.username+"<br>So you want to "+req.params.activity+" an activity?<br>";
    body += "Which object would you like to use?"
    const options = ["note", "article", "question", "event", "image"]
    body += "<ul>"
    for(let option of options){
        body += "<li><a href='/ap/admin/tester/"+username+"/"+activity+"/"+option+"'>"+option+"</a></li>"
    }
    body += "</ul>"
    body += "<pre style='border: 1px solid #ccc; margin: 10px; padding: 10px;'>"+JSON.stringify(wrapInCreate({}, username, domain, []), undefined, 4)+"</pre>"
    res.send(body)
})

router.get("/:username/:activity/:object", (req, res) => {
    const domain = req.app.get('domain');
    const guid = 123456;
    const dd = new Date();
    const publishedAt = dd.toISOString();
    const content = "LALALA";
    const name = "NAME";
    url = "https://lol.dk"
    const { username, activity, object } = req.params;
    var body = "Hi "+req.params.username+"<br>So you want to "+req.params.activity+" an "+object+"?";
    body += "<pre style='border: 1px solid #ccc; margin: 10px; padding: 10px;'>"+JSON.stringify(wrapInCreate(makeArticle(username, domain, guid, publishedAt, content, name, url = ""), username, domain, []), undefined, 4)+"</pre>"
    res.send(body)
})

router.get("*", (req, res) => {
    res.sendStatus(404)
})

module.exports = router;