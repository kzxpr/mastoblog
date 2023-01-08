const express = require('express'),
      router = express.Router();

const db = require("./../../knexfile")
const knex = require("knex")(db)
      
const { createActor } = require("./lib/createActor")
const { wrapInCreate, wrapInUpdate, wrapInDelete, wrapInFlag, wrapInUndo, wrapInAnnounce, wrapInFollow, wrapInLike } = require("./lib/wrappers")
const { signAndSend } = require("./lib/signAndSend")
const { makeArticle, makeEvent, makeNote, makeQuestion, makeImage } = require("./lib/makeMessage")
const { findInbox } = require("./lib/addAccount")
const { addMessage } = require("./lib/addMessage")

const tester_root = "/ap/admin/tester";

function header(){
    var body = "<h1>Let's test ActivityPub</h1>"
    body += "LIKE (= favourite): Like > Id > Message as 'id' + author in 'to'<br>"
    body += "REPLY: Create > Note > Use 'inReplyTo' + author in 'to'<br>"
    body += "FOLLOW: Follow > Id > Account as 'id' + author in 'to'<br>"
    body += "ANNOUNCE (= boost): Announce > Id > Message as 'id' + author in 'to'<br>"
    body += "UPDATE PROFILE: Update it in database, then Update > Id > Profile as 'id'<br>"
    body += "UPDATE POST: Update it in database, then Update > Id > Message as 'id'<br>"
    body += "<hr>"
    return body;
}

function prettyTest(obj){
    return "<pre style='border: 1px solid #ccc; margin: 10px; padding: 10px;'>"+JSON.stringify(obj, undefined, 4)+"</pre>";
}

router.get("/", async(req, res) => {
    let domain = req.app.get('domain');
    var msg = "";
    if(req.query.username){
        const username = req.query.username;
        console.log("createActor:", username, domain)
        await createActor(username, domain)
            .then(async (account) => {
                await knex("apaccounts").insert({
                    ...account,
                    createdAt: knex.fn.now()
                })
                .then(() => {
                    msg = "Created actor: "+username+"@"+domain;
                })
                .catch((e) => {
                    console.error("ERROR while creating new actor", e)
                    msg = "ERROR adding actor: "+username+"@"+domain;
                })
            })
            .catch((e) => {
                msg = "ERROR while creating actor: "+username+"@"+domain;
            })
    }
    
    
    var body = header();
    body += "Who are you?!<br>"
    if(msg!=""){
        body += "<i>"+msg+"</i><br>"
    }
    body += "<ul>"
    await knex("apaccounts").where("handle", "like", "%@"+domain).then((users) => {
        for(let user of users){
            let username = user.username
            body += "<li><a href='"+tester_root+"/"+username+"'>"+username+"</a></li>"
        }
    })
    body += "</ul>"
    body += "<b>Create new actor</b><br>";
    body += "<form action='"+tester_root+"/' method='get'>";
    body += "<input type='text' name='username' placeholder='username'>"
    body += "<input type='submit' value='Create actor'>"
    body += "</form>"
    res.send(body)
})

router.get("/:username", (req, res) => {
    const { username } = req.params;
    var body = header();
    body += "Hi "+username+".<br>";
    body += "What should we do?"
    const options = ["Create", "Update", "Undo", "Delete", "Follow", "Like", "Announce", "Flag"]
    body += "<ul>"
    for(let option of options){
        body += "<li><a href='"+tester_root+"/"+username+"/"+option+"'>"+option+"</a></li>"
    }
    body += "</ul>"
    res.send(body)
})

router.get("/:username/:activity", (req, res) => {
    const domain = req.app.get('domain');
    const { username, activity } = req.params;
    const guid = "";
    const ref_url = "https://"+domain+"/u/"+username+"/statuses/"+guid;
    var body = header();
    body += "Hi "+req.params.username+"<br>So you want to <b>"+req.params.activity+"</b> an activity?<br>";
    body += "Which object would you like to use?"
    const options = ["Note", "Question", "Article", "Page", "Event", "Image", "Audio", "Video", "Id"]
    body += "<ul>"
    for(let option of options){
        body += "<li><a href='"+tester_root+"/"+username+"/"+activity+"/"+option+"'>"+option+"</a></li>"
    }
    body += "</ul>"
    const preview = wrap(activity, {}, { username, domain, ref_url });
    body += prettyTest(preview)
    res.send(body)
})

function makeObject(object, params, body){
    const { domain, username, guid, published } = params;
    const stringobj = body.stringobj !== undefined ? body.stringobj : "https://"+domain+"/u/"+username+"/";
    const content = body.content !== undefined ? body.content : "This is the content of the message <i>including</i> HTML"
    const summary = body.summary !== undefined ? body.summary : "This is the summary text..."
    const name = body.name !== undefined ? body.name : "This is name - no HTML here"
    const to = body.to !== undefined ? body.to : "https://todon.eu/users/kzxpr"
    const cc = body.cc !== undefined ? body.cc : "https://www.w3.org/ns/activitystreams#Public"
    const startTime = body.startTime !== undefined ? body.startTime : "2023-12-31T23:00:00-08:00";
    const endTime = body.endTime !== undefined ? body.endTime : "2024-01-01T06:00:00-08:00";
    const inReplyTo = body.inReplyTo !== undefined ? body.inReplyTo : "";
    const anyOf = body.anyOf !== undefined ? body.anyOf : "";
    const oneOf = body.oneOf !== undefined ? body.oneOf : '[{"type": "Note","name": "Yes"},{"type": "Note","name": "No"}]';
    const closed = body.closed !== undefined ? body.closed : "";
    const href = body.href !== undefined ? body.href : "https://"+domain+"/public/";
    const mediaType = body.mediaType !== undefined ? body.mediaType : "image/png";
    const manual_guid = body.manual_guid != "" ? body.manual_guid : guid;
    const url = body.url !== undefined ? body.url : "https://"+domain+"/u/"+username+"/message/"+manual_guid;
    var body = "";
    var hidden = "";
    var obj;
    attributedTo = "https://"+domain+"/u/"+username+"/";
    body += "<table>"
    body += "<tr><td colspan='3'><u>Common parameters</u></tr>"
    //body += "<tr><td width='120'>guid:<td> "+guid+"<td>(generated later)</tr>"
    body += "<tr><td width='120'>guid:<td> <input type='text' name='manual_guid' value='"+manual_guid+"' style='width: 100%; max-width: 300px;'><td>(leave blank to generate later)</tr>";
    body += "<tr><td>attributed:<td> "+attributedTo+"<td></tr>"
    body += "<tr><td>published:<td> "+published+"<td>(updates automatically)</tr>"
    body += "<tr><td>to:<td> <input type='text' name='to' value='"+to+"' style='width: 100%; max-width: 300px;'><td>(url)</tr>";
    body += "<tr><td>cc:<td> <input type='text' name='cc' value='"+cc+"' style='width: 100%; max-width: 300px;'><td>(url)</tr>";
    body += "<tr><td>inReplyTo:<td> <input type='text' name='inReplyTo' value='"+inReplyTo+"' style='width: 100%; max-width: 300px;'><td>(url - if using this remember to include owner in 'to')</tr>";
    //
    hidden += "<input type='hidden' name='to' value='"+to+"'>";
    hidden += "<input type='hidden' name='cc' value='"+cc+"'>";
    hidden += "<input type='hidden' name='inReplyTo' value='"+inReplyTo+"'>";
    hidden += "<input type='hidden' name='manual_guid' value='"+manual_guid+"'>";
    
    body += "<tr><td colspan='3'><u>Special parameters</u></tr>"
    body += "</table>"
    if(object=="Id"){
        body += "<label>string:</label> <input type='text' name='stringobj' value='"+stringobj+"' style='width: 100%; max-width: 300px;'> (url)<br>";
        hidden += "<input type='hidden' name='stringobj' value='"+stringobj+"'>";
        obj = stringobj;
    }else if(object=="Note"){
        //body += "<label>name</label><input type='text' name='name' value='"+name+"'><br>"
        body += "<label>content</label><input type='text' name='content' value='"+content+"'><br>"
        body += "<label>summary</label><input type='text' name='summary' value='"+summary+"'><br>"
        //hidden += "<input type='hidden' name='name' value='"+name+"'>";
        hidden += "<input type='hidden' name='content' value='"+content+"'>";
        hidden += "<input type='hidden' name='summary' value='"+summary+"'>";
        obj = makeNote(username, domain, manual_guid, { published, name, content, to, cc, url, summary, inReplyTo })
    }else if(object=="Image"){
        body += "<label>name</label><input type='text' name='name' value='"+name+"'><br>"
        body += "<label>href</label><input type='text' name='href' value='"+href+"'><br>"
        body += "<label>mediaType</label><input type='text' name='mediaType' value='"+mediaType+"'><br>"
        hidden += "<input type='hidden' name='name' value='"+name+"'>";
        hidden += "<input type='hidden' name='href' value='"+href+"'>";
        hidden += "<input type='hidden' name='mediaType' value='"+mediaType+"'>";
        obj = makeImage(username, domain, manual_guid, { name, to, cc, href, mediaType, inReplyTo })
    }else if(object=="Event"){
        body += "<label>name</label><input type='text' name='name' value='"+name+"'><br>"
        //body += "<label>content</label><input type='text' name='content' value='"+content+"'><br>"
        body += "<label>summary</label><input type='text' name='summary' value='"+summary+"'><br>"
        body += "<label>startTime</label><input type='text' name='startTime' value='"+startTime+"'><br>"
        body += "<label>endTime</label><input type='text' name='endTime' value='"+endTime+"'><br>"
        hidden += "<input type='hidden' name='name' value='"+name+"'>";
        hidden += "<input type='hidden' name='startTime' value='"+startTime+"'>";
        hidden += "<input type='hidden' name='endTime' value='"+endTime+"'>";
        //hidden += "<input type='hidden' name='content' value='"+content+"'>";
        hidden += "<input type='hidden' name='summary' value='"+summary+"'>";
        obj = makeEvent(username, domain, manual_guid, { published, name, content, to, cc, startTime, endTime, url, summary })
    }else if(object=="Question"){
        body += "<label>content</label><input type='text' name='content' value='"+content+"'><br>"
        body += "<label>anyOf</label><input type='text' name='anyOf' value='"+anyOf+"'><br>"
        body += "<label>oneOf</label><input type='text' name='oneOf' value='"+oneOf+"'><br>"
        body += "<label>closed</label><input type='text' name='closed' value='"+closed+"'><br>"
        body += "<label>endTime</label><input type='text' name='endTime' value='"+endTime+"'><br>"
        hidden += "<input type='hidden' name='content' value='"+content+"'>";
        hidden += "<input type='hidden' name='anyOf' value='"+anyOf+"'>";
        hidden += "<input type='hidden' name='oneOf' value='"+oneOf+"'>";
        hidden += "<input type='hidden' name='endTime' value='"+endTime+"'>";
        hidden += "<input type='hidden' name='closed' value='"+closed+"'>";
        obj = makeQuestion(username, domain, manual_guid, { published, content, to, cc, anyOf, oneOf, endTime, closed })
    }else{
        body += "<label>Content</label><input type='text' name='content' value='"+content+"'><br>"
        hidden += "<input type='hidden' name='content' value='"+content+"'>";
        obj = makeArticle(username, domain, manual_guid, published, content, name, url)
    }

    return { form_append: body, hidden_append: hidden, obj }
}

function wrap(activity, obj, params){
    const { username, domain, ref_url, to, cc } = params;
    const actor = "https://"+domain+"/u/"+username;
    switch(activity){
        case 'Create': wrapped = wrapInCreate(obj, actor, domain, [], ref_url); break;
        case 'Delete': wrapped = wrapInDelete(obj, actor, domain, [], { to, cc }); break;
        case 'Update': wrapped = wrapInUpdate(obj, actor, domain, [], ref_url); break;
        case 'Flag': wrapped = wrapInFlag(obj, actor, domain, [], ref_url); break;
        case 'Undo': wrapped = wrapInUndo(obj, actor, domain, [], ref_url, { to, cc }); break;
        case 'Announce': wrapped = wrapInAnnounce(obj, actor, domain, { to, cc }, ref_url); break;
        case 'Follow': wrapped = wrapInFollow(obj, actor, domain, [], ref_url); break;
        case 'Like': wrapped = wrapInLike(obj, actor, domain, [], ref_url); break;
    }
    return wrapped
}

router.all("/:username/:activity/:object", (req, res) => {
    const { username, activity, object } = req.params;
    const domain = req.app.get('domain');
    
    const guid = "";
    const dd = new Date();
    const published = dd.toISOString();

    const to = req.body.to !== undefined ? req.body.to : "";
    const cc = req.body.cc !== undefined ? req.body.cc : "";

    /* BODY AND STUFF */
    var body = header();
    body += "Hi "+username+"<br>So you want to "+activity+" an <b>"+object+"</b>?<br><br>";
    body += "<b>Parameters</b><br>"

    hidden = "<form action='"+tester_root+"/"+username+"/"+activity+"/"+object+"/sign' method='post'>";
    body += "<form action='"+tester_root+"/"+username+"/"+activity+"/"+object+"' method='post'>"
    
    const { form_append, hidden_append, obj } = makeObject(object, { username, domain, published, guid }, req.body)
    //console.log("BO", obj)
    body += form_append;
    hidden += hidden_append;
    body += "<br><input type='submit' value='Update preview'>"
    body += "</form>"
    hidden += "<br><input type='submit' value='Go to sign and send!'>"
    hidden += "</form>"
    const ref_url = "https://"+domain+"/u/"+username+"/statuses/"+guid;
    const preview = wrap(activity, obj, { username, domain, ref_url, to, cc });
    body += prettyTest(preview)
    body += hidden;
    res.send(body)
})

router.post("/:username/:activity/:object/sign", (req, res) => {
    const { username, activity, object } = req.params;
    const domain = req.app.get('domain');
    
    const to = req.body.to !== undefined ? req.body.to : "";
    const cc = req.body.cc !== undefined ? req.body.cc : "";

    const guid = "";
    const dd = new Date();
    const published = dd.toISOString();
    var body = header();
    const { body_append, hidden_append, obj } = makeObject(object, { username, domain, published, guid }, req.body)

    body += "Review one last time...<br>"
    body += "<form action='"+tester_root+"/"+username+"/"+activity+"/"+object+"/sign/send' method='post'>"
    body += hidden_append;
    const ref_url = "https://"+domain+"/u/"+username+"/statuses/"+guid;
    const preview = wrap(activity, obj, { username, domain, ref_url, to, cc });
    body += prettyTest(preview)
    body += "To: "+req.body.to+"<br>";
    body += "CC: "+req.body.cc+"<br>";
    body += "<input type='submit' value='Send'>"
    body += "</form>"
    res.send(body);
});

router.post("/:username/:activity/:object/sign/send", async (req, res) => {
    const { username, activity, object } = req.params;
    const domain = req.app.get('domain');

    const to = req.body.to !== undefined ? req.body.to : "";
    const cc = req.body.cc !== undefined ? req.body.cc : "";
    
    const guid = crypto.randomBytes(16).toString('hex');;
    const dd = new Date();
    const published = dd.toISOString();
    var body = header();
    const { body_append, hidden_append, obj } = makeObject(object, { username, domain, published, guid }, req.body)

    const uri = "https://"+domain+"/u/"+username;
    const ref_url = uri+"/statuses/"+guid;
    const wrapped = wrap(activity, obj, { username, domain, ref_url, to, cc });
    body += prettyTest(wrapped)

    var followers = new Array();
    if(to!="" && to !="https://www.w3.org/ns/activitystreams#Public"){
        followers.push(to)
    }
    if(cc!="" && cc!="https://www.w3.org/ns/activitystreams#Public"){
        followers.push(cc)
    }
    console.log("A", activity)
    if(activity == "Create" && typeof obj === 'object'){
        await addMessage(obj)
        .then(async(ok) => {
            console.log("Added message to DB")
        })
        .catch((e) => {
            console.error("ERROR in addMessage")
            res.sendStatus(500)
        })
    }
    
            for(let follower of followers){
                let inbox = await findInbox(follower)
                let myURL = new URL(follower);
                let targetDomain = myURL.hostname;
                await signAndSend(wrapped, uri, targetDomain, inbox)
                .then((data) => {
                    console.log("SEND NOTE RESPONSE",data)
                    body += "To: "+follower+" = OK<br>";
                })
                .catch((err) => {
                    console.error(err)
                    body += "To: "+follower+" = ERROR<br>";
                })
            }
        
    
    //body += "To: "+req.body.to+"<br>";
    //body += "CC: "+req.body.cc+"<br>";
    body += "<a href='"+tester_root+"'>BACK!</a>"
    res.send(body);
});

router.get("*", (req, res) => {
    res.sendStatus(404)
})

module.exports = router;