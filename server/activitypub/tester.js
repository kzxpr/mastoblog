const express = require('express'),
      router = express.Router();

const db = require("./../../knexfile")
const knex = require("knex")(db)
      
const { createActor } = require("./lib/createActor")
const { wrapInCreate, wrapInUpdate, wrapInDelete, wrapInFlag, wrapInUndo, wrapInAnnounce, wrapInFollow, wrapInLike } = require("./lib/wrappers")
const { signAndSend } = require("./lib/signAndSend")
const { makeArticle, makeEvent, makeNote, makeQuestion, makeImage, handleAddress } = require("./lib/makeMessage")
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

async function makeObject(object, params, body){
    const { domain, username, guid, published } = params;
    const stringobj = body.stringobj !== undefined ? body.stringobj : "https://"+domain+"/u/"+username+"/";
    const content = body.content !== undefined ? body.content : "This is the content of the message <i>including</i> HTML"
    const summary = body.summary !== undefined ? body.summary : "This is the summary text..."
    const name = body.name !== undefined ? body.name : "This is name - no HTML here"
    const to = body.to !== undefined ? body.to : "https://todon.eu/users/kzxpr"
    const cc = body.cc !== undefined ? body.cc : ""
    const startTime = body.startTime !== undefined ? body.startTime : "2023-12-31T23:00:00-08:00";
    const endTime = body.endTime !== undefined ? body.endTime : "2024-01-01T06:00:00-08:00";
    const inReplyTo = body.inReplyTo !== undefined ? body.inReplyTo : "";
    const anyOf = body.anyOf !== undefined ? body.anyOf : "";
    const oneOf = body.oneOf !== undefined ? body.oneOf : '[{"type": "Note","name": "Yes"},{"type": "Note","name": "No"}]';
    const closed = body.closed !== undefined ? body.closed : "";
    var href = new Array();
    var mediaType = new Array();
    if(body.href !== undefined){
        if(Array.isArray(body.href)){
            href = body.href;
            mediaType = body.mediaType;
        }else{
            href = new Array(body.href)
            mediaType = new Array(body.mediaType)
        }
    }
    
    const manual_guid = body.manual_guid != "" ? body.manual_guid : guid;
    const url = body.url !== undefined ? body.url : "https://"+domain+"/u/"+username+"/message/"+manual_guid;
    const public = ((body.public !== undefined) && (body.public != "false"))
        ? true : false;
    const followshare = ((body.followshare !== undefined) && (body.followshare != "false"))
        ? true : false;
    const n_attachs = body.n_attachs !== undefined ? body.n_attachs : 0;
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
    body += "<tr><td>to:<td> <input type='text' name='to' value='"+to+"' style='width: 100%; max-width: 300px;'><td>(url - separate with space)</tr>";
    body += "<tr><td>public:<td> <input type='checkbox' name='public' value='yes'";
    if(public){
        body += "checked"
    }
    body += "><td>(include public)</tr>";
    body += "<tr><td>cc:<td> <input type='text' name='cc' value='"+cc+"' style='width: 100%; max-width: 300px;'><td>(url - separate with space)</tr>";
    body += "<tr><td>follower:<td> <input type='checkbox' name='followshare' value='yes' ";
    if(followshare){
        body += "checked"
    }
    body += "><td>(include user's follower)</tr>";
    body += "<tr><td>inReplyTo:<td> <input type='text' name='inReplyTo' value='"+inReplyTo+"' style='width: 100%; max-width: 300px;'><td>(url - if using this remember to include owner in 'to')</tr>";
    //
    hidden += "<input type='hidden' name='to' value='"+to+"'>";
    hidden += "<input type='hidden' name='public' value='"+public+"'>";
    hidden += "<input type='hidden' name='cc' value='"+cc+"'>";
    hidden += "<input type='hidden' name='followshare' value='"+followshare+"'>";
    hidden += "<input type='hidden' name='inReplyTo' value='"+inReplyTo+"'>";
    hidden += "<input type='hidden' name='manual_guid' value='"+manual_guid+"'>";
    
    body += "<tr><td colspan='3'><u>Special parameters</u></tr>"
    
    if(object=="Id"){
        body += "<tr><td>string:</td><td><input type='text' name='stringobj' value='"+stringobj+"' style='width: 100%; max-width: 300px;'> (url)</td></tr>";
        hidden += "<input type='hidden' name='stringobj' value='"+stringobj+"'>";
        obj = stringobj;
    }else if(object=="Note"){
        //body += "<label>name</label><input type='text' name='name' value='"+name+"'><br>"
        body += "<tr><td>content</td><td><input type='text' name='content' value='"+content+"'></td></tr>"
        body += "<tr><td>summary</td><td><input type='text' name='summary' value='"+summary+"'></td></tr>"

        body += "<tr><td colspan='3'><u>Attachments:</u><td></tr>";
        body += "<tr><td>number of attachments</td><td><input type='number' name='n_attachs' value='"+n_attachs+"'></td></tr>"
        const attachment_types = new Array("image/png", "image/jpeg", "audio/mpeg")
        if(n_attachs>0){
            for(let n = 0; n < n_attachs; n++){
                body += "<tr>"
                body += "<td>attachment"+n+"</td>";
                body += "<td><input type='text' name='href' value='"+(href[n] ? href[n] : "")+"'></td>";
                body += "<td><select name='mediaType' value='"+mediaType[n]+"'>"
                for(let attachment_type of attachment_types){
                    body += "<option value='"+attachment_type+"' ";
                    if(attachment_type == mediaType[n]){
                        body += "selected"
                    }
                    body += ">"+attachment_type+"</option>"
                }
                body += "</select></td>"
                body += "</tr>"
            }
        }
        
        //hidden += "<input type='hidden' name='name' value='"+name+"'>";
        hidden += "<input type='hidden' name='content' value='"+content+"'>";
        hidden += "<input type='hidden' name='summary' value='"+summary+"'>";
        hidden += "<input type='hidden' name='n_attachs' value='"+n_attachs+"'>";
        if(n_attachs>0){
            for(let n = 0; n < n_attachs; n++){
                hidden += "<input type='hidden' name='mediaType' value='"+mediaType[n]+"'>";
                hidden += "<input type='hidden' name='href' value='"+href[n]+"'>";
            }
        }
        obj = await makeNote(username, domain, manual_guid, { published, name, n_attachs, href, mediaType, content, to, cc, url, summary, inReplyTo, public, followshare })
    }else if(object=="Image"){
        body += "<tr><td>name</td><td><input type='text' name='name' value='"+name+"'></td></tr>"
        body += "<tr><td>href</td><td><input type='text' name='href' value='"+href+"'></td></tr>"
        body += "<tr><td>mediaType</td><td><input type='text' name='mediaType' value='"+mediaType+"'></td></tr>"
        hidden += "<input type='hidden' name='name' value='"+name+"'>";
        hidden += "<input type='hidden' name='href' value='"+href+"'>";
        hidden += "<input type='hidden' name='mediaType' value='"+mediaType+"'>";
        obj = makeImage(username, domain, manual_guid, { name, to, cc, href, mediaType, inReplyTo, public, followshare })
    }else if(object=="Event"){
        body += "<tr><td>name</td><td><input type='text' name='name' value='"+name+"'></td></tr>"
        //body += "<label>content</label><input type='text' name='content' value='"+content+"'><br>"
        body += "<tr><td>summary</td><td><input type='text' name='summary' value='"+summary+"'></td></tr>"
        body += "<tr><td>startTime</td><td><input type='text' name='startTime' value='"+startTime+"'></td></tr>"
        body += "<tr><td>endTime</td><td><input type='text' name='endTime' value='"+endTime+"'></td></tr>"
        hidden += "<input type='hidden' name='name' value='"+name+"'>";
        hidden += "<input type='hidden' name='startTime' value='"+startTime+"'>";
        hidden += "<input type='hidden' name='endTime' value='"+endTime+"'>";
        //hidden += "<input type='hidden' name='content' value='"+content+"'>";
        hidden += "<input type='hidden' name='summary' value='"+summary+"'>";
        obj = makeEvent(username, domain, manual_guid, { published, name, content, to, cc, startTime, endTime, url, summary, public, followshare })
    }else if(object=="Question"){
        body += "<tr><td>content</td><td><input type='text' name='content' value='"+content+"'></td></tr>"
        body += "<tr><td>anyOf</td><td><input type='text' name='anyOf' value='"+anyOf+"'></td></tr>"
        body += "<trl><td>oneOf</td><td><input type='text' name='oneOf' value='"+oneOf+"'></td></tr>"
        body += "<tr><td>closed</td><td><input type='text' name='closed' value='"+closed+"'></td></tr>"
        body += "<tr><td>endTime</td><td><input type='text' name='endTime' value='"+endTime+"'></td></tr>"
        hidden += "<input type='hidden' name='content' value='"+content+"'>";
        hidden += "<input type='hidden' name='anyOf' value='"+anyOf+"'>";
        hidden += "<input type='hidden' name='oneOf' value='"+oneOf+"'>";
        hidden += "<input type='hidden' name='endTime' value='"+endTime+"'>";
        hidden += "<input type='hidden' name='closed' value='"+closed+"'>";
        obj = makeQuestion(username, domain, manual_guid, { published, content, to, cc, anyOf, oneOf, endTime, closed, public, followshare })
    }else{
        body += "<tr><td>Content</td><td><input type='text' name='content' value='"+content+"'></td></tr>"
        hidden += "<input type='hidden' name='content' value='"+content+"'>";
        obj = makeArticle(username, domain, manual_guid, published, content, name, url, to, cc, public, followshare)
    }
    body += "</table>"
    return { form_append: body, hidden_append: hidden, obj }
}

function wrap(activity, obj, params){
    const { username, domain, ref_url, to, cc } = params;
    const actor = "https://"+domain+"/u/"+username;
    switch(activity){
        case 'Create': wrapped = wrapInCreate(obj, actor, "guid"); break;
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

router.all("/:username/:activity/:object", async (req, res) => {
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
    
    const { form_append, hidden_append, obj } = await makeObject(object, { username, domain, published, guid }, req.body)
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

router.post("/:username/:activity/:object/sign", async (req, res) => {
    const { username, activity, object } = req.params;
    const domain = req.app.get('domain');

    console.log("BODY", req.body)
    
    const to = req.body.to !== undefined ? req.body.to : "";
    const cc = req.body.cc !== undefined ? req.body.cc : "";

    const guid = "";
    const dd = new Date();
    const published = dd.toISOString();
    var body = header();
    const { body_append, hidden_append, obj } = await makeObject(object, { username, domain, published, guid }, req.body)

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
    const public = ((req.body.public !== undefined) && (req.body.public!="false"))
        ? true : false;
    const followshare = ((req.body.followshare !== undefined) && (req.body.followshare!="false"))
        ? true : false;
    
    const { to_field, cc_field } = handleAddress({ to, cc, public, followshare, username, domain })
    const recipient_list = to_field.concat(cc_field)

    const guid = crypto.randomBytes(16).toString('hex');;
    const dd = new Date();
    const published = dd.toISOString();
    var body = header();
    const { body_append, hidden_append, obj } = await makeObject(object, { username, domain, published, guid }, req.body)

    const uri = "https://"+domain+"/u/"+username;
    const ref_url = uri+"/statuses/"+guid;
    const wrapped = wrap(activity, obj, { username, domain, ref_url, to, cc });
    body += prettyTest(wrapped)

    var recipients = new Array();
    for(let r of recipient_list){
        if(r == uri+"/followers"){
            recipients.concat(await knex("apfollowers").where("username", "=", uri).select("follower")
                .then((users) => {
                    return users.map((user) => {
                        return user.follower;
                    })
                })
                .catch((e) => {
                    console.error("ERROR while getting followers", uri)
                })
            );
        }else if(r != "" && r != "https://www.w3.org/ns/activitystreams#Public"){
            recipients.push(r)
        }
    }

    console.log("RECIPIENTS", recipients)
    console.log("A", activity)

    /* ADD ACTIVITY TO DATABASE */
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
    
    for(let recipient of recipients){
        let inbox = await findInbox(recipient)
        let recipient_url = new URL(recipient);
        let targetDomain = recipient_url.hostname;
        await signAndSend(wrapped, uri, targetDomain, inbox)
            .then((data) => {
                console.log("SEND NOTE RESPONSE",data)
                body += "To: "+recipient+" = OK<br>";
            })
            .catch((err) => {
                console.error(err)
                body += "To: "+recipient+" = ERROR<br>";
            })
    }

    body += "<a href='"+tester_root+"'>BACK!</a>"
    res.send(body);
});

router.get("*", (req, res) => {
    res.sendStatus(404)
})

module.exports = router;