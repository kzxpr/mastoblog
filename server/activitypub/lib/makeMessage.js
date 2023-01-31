const { encodeImageToBlurhash } = require("./blurhash")

function makeMessage(uri, guid, params){
    const { published, content, url, cc, to, public, followshare } = params;
    var url_link;
    if(!url){
        url_link = uri+"/statuses/"+guid;
        message_uri = uri+"/statuses"+guid;
    }else{
        url_link = url;
        message_uri = url;
    }
    //const { to_field, cc_field } = handleAddress({ to, cc, public, followshare, username, domain });
    return {
        "@context": ["https://www.w3.org/ns/activitystreams"],
        "id": message_uri,
        "type": "Note",
        "published": published,
        "attributedTo": uri,
        "to": to,
        "cc": cc,
        "url": url_link,
        "content": content,
        "contentMap": {
            "en": content
        }
    }
}

function handleAddress(params){
    const { to, cc, public, followshare, username, domain } = params;
    //console.log("RUN HANDLE with", params)
    var to_field, cc_field;
    if(to && to.length>0){
        to_field = to.split(" ")
    }else{
        to_field = new Array();
    }
    if(public){
        to_field.push("https://www.w3.org/ns/activitystreams#Public")
    }
    if(cc && cc.length>0){
        cc_field = cc.split(" ")
    }else{
        cc_field = new Array();
    }
    if(followshare){
        cc_field.push("https://"+domain+"/u/"+username+"/followers")
    }
    return { cc_field, to_field }
}

async function makeNote(username, domain, guid, params){
    const { published, name, content, to, cc, url, href, mediaType, summary, inReplyTo, public, followshare } = params;
    var url_link;
    if(!url){
        url_link = "https://"+domain+"/u/"+username+"/statuses/"+guid;
    }else{
        url_link = url;
    }
    var obj = {};
    obj["@context"] = ["https://www.w3.org/ns/activitystreams"]
    obj["id"] = "https://"+domain+"/u/"+username+"/statuses/"+guid;
    obj["type"] = "Note"
    obj["published"] = published;
    obj["attributedTo"] = "https://"+domain+"/u/"+username;
    const { to_field, cc_field } = handleAddress({ to, cc, public, followshare, username, domain });
    obj["to"] = to_field;
    obj["cc"] = cc_field;
    obj["url"] = url_link;
    if(inReplyTo){
        obj["inReplyTo"] = inReplyTo;
    }
    obj["summary"] = summary;
    obj["content"] = content;
    obj["contentMap"] = { "en": summary };
    if(href && href != null){
        attachments = new Array();
        var a = {};
        a.type = "Note";
        a.mediaType = mediaType;
        a.url = href;
        a.name = "Untitled"
        a.blurhash = await encodeImageToBlurhash(a.url)
        //a.blurhash = "UdM7ifM{0KIox^RPt7WVx]ozs.Rj%goenhs:";
        a.width = 387;
        a.height = 258;
        attachments.push(a)
        obj["attachment"] = attachments;
    }
    return obj;
}

function makeArticle(username, domain, guid, params){
    const {published, content, name, url, to, cc, public, followshare } = params;
    var url_link;
    if(!url){
        url_link = "https://"+domain+"/u/"+username+"/statuses/"+guid;
    }else{
        url_link = url;
    }
    const { to_field, cc_field } = handleAddress({ to, cc, public, followshare, username, domain });
    return {
        "@context": ["https://www.w3.org/ns/activitystreams"],
        "id": "https://"+domain+"/u/"+username+"/statuses/"+guid,
        "type": "Article",
        "published": published,
        "attributedTo": "https://"+domain+"/u/"+username,
        "to": to_field,
        "cc": cc_field,
        "url": url_link,
        "name": name,
        "content": content,
        "contentMap": {
            "en": content
        }
    }
}

function makePage(username, domain, guid, params){
    const { published, content, url, public, followshare, to, cc } = params;
    var url_link;
    if(!url){
        url_link = "https://"+domain+"/u/"+username+"/statuses/"+guid;
    }else{
        url_link = url;
    }
    const { to_field, cc_field } = handleAddress({ to, cc, public, followshare, username, domain });
    return {
        "@context": ["https://www.w3.org/ns/activitystreams"],
        "id": "https://"+domain+"/u/"+username+"/statuses/"+guid,
        "type": "Page",
        "published": published,
        "attributedTo": "https://"+domain+"/u/"+username,
        "to": to_field,
        "cc": cc_field,
        "url": url_link,
        "content": content,
    }
}

function makeEvent(username, domain, guid, params){
    const { startTime, endTime, name, published, url, summary, to, cc, public, followshare } = params;
    var url_link;
    if(!url){
        url_link = "https://"+domain+"/u/"+username+"/statuses/"+guid;
    }else{
        url_link = url;
    }
    const { to_field, cc_field } = handleAddress({ to, cc, public, followshare, username, domain });
    return {
        "@context": ["https://www.w3.org/ns/activitystreams"],
        "id": "https://"+domain+"/u/"+username+"/statuses/"+guid,
        "type": "Event",
        "published": published,
        "startTime": startTime,
        "endTime": endTime,
        "attributedTo": "https://"+domain+"/u/"+username,
        "to": to_field,
        "cc": cc_field,
        "url": url_link,
        "name": name,
        "summary": summary
    }
}

function makeQuestion(username, domain, guid, params){
    const { anyOf, oneOf, content, published, url, closed, to, cc, public, followshare } = params;
    var url_link;
    if(!url){
        url_link = "https://"+domain+"/u/"+username+"/statuses/"+guid;
    }else{
        url_link = url;
    }
    const { to_field, cc_field } = handleAddress({ to, cc, public, followshare, username, domain });
    var obj = {
        "@context": ["https://www.w3.org/ns/activitystreams"],
        "id": "https://"+domain+"/u/"+username+"/statuses/"+guid,
        "type": "Question",
        "published": published,
        "attributedTo": "https://"+domain+"/u/"+username,
        "to": to_field,
        "cc": cc_field,
        "content": content
    }
    if(closed){
        obj["closed"] = closed;
    }else if(anyOf){
        obj["anyOf"] = JSON.parse(anyOf);
    }else if(oneOf){
        obj["oneOf"] = JSON.parse(oneOf);
    }

    return obj;
}

function makeImage(username, domain, guid, params){
    const { name, href, to, cc, mediaType, inReplyTo, url, public, followshare } = params;
    var url_link;
    if(!url){
        url_link = "https://"+domain+"/u/"+username+"/statuses/"+guid;
    }else{
        url_link = url;
    }
    var obj = {};
    obj["@context"] = ["https://www.w3.org/ns/activitystreams"]
    obj["id"] = "https://"+domain+"/u/"+username+"/statuses/"+guid;
    obj["type"] = "Image"
    obj["attributedTo"] = "https://"+domain+"/u/"+username;
    const { to_field, cc_field } = handleAddress({ to, cc, public, followshare, username, domain });
    obj["to"] = to_field;
    obj["cc"] = cc_field;
    if(inReplyTo){
        obj["inReplyTo"] = inReplyTo;
    }
    obj["name"] = name;
    var links = new Array();
    links.push({ "type": "Link", "href": href, "mediaType": mediaType })
    obj["url"] = links;

    var attachments = new Array();
    attachments.push({ url: href, summary: name })
    obj["attachment"] = attachments;

    return obj;
}

module.exports = { makeMessage, makeArticle, makeEvent, makeNote, makeQuestion, makeImage, makePage, handleAddress }