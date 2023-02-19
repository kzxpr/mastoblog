const { encodeImageToBlurhash } = require("./blurhash")

function makeMessage(uri, guid, params){
    const { published, content, url, cc, to, public, followshare, sensitive } = params;
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
        "sensitive": sensitive,
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
    const { published, name, content, sensitive, to, cc, url, n_attachs, href, mediaType, summary, inReplyTo, public, followshare } = params;
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
    obj["sensitive"] = sensitive;
    obj["url"] = url_link;
    if(inReplyTo){
        obj["inReplyTo"] = inReplyTo;
    }
    obj["summary"] = summary;
    obj["content"] = content;
    obj["contentMap"] = { "en": summary };
    if(href && href != null){
        var urls = href;
        var types = mediaType;
        if(!Array.isArray(href)){
            urls = new Array(href)
            types = new Array(mediaType)
        }
        attachments = new Array();
        for(let i = 0; i < n_attachs; i++){
            if(urls[i] !== undefined){
                var a = {};
                a.type = "Note";
                a.mediaType = types[i];
                a.url = urls[i];
                a.name = "Untitled"
                a.blurhash = await encodeImageToBlurhash(a.url)
                .then((blurhash) => {
                    return blurhash
                })
                .catch((e) => {
                    console.error("ERROR encoding blurhash", e)
                })
                a.width = 387;
                a.height = 258;
                attachments.push(a)
            }
            
        }
        obj["attachment"] = attachments;
    }
    return obj;
}

function makeArticle(username, domain, guid, params){
    const { published, content, name, url, to, cc, public, followshare, sensitive } = params;
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
        "sensitive": sensitive,
        "url": url_link,
        "name": name,
        "content": content,
        "contentMap": {
            "en": content
        }
    }
}

function makePage(username, domain, guid, params){
    const { published, content, url, public, followshare, sensitive, to, cc } = params;
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
        "sensitive": sensitive,
        "url": url_link,
        "content": content,
    }
}

function makeEvent(username, domain, guid, params){
    const { startTime, endTime, name, published, url, summary, to, cc, sensitive, public, followshare } = params;
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
        "sensitive": sensitive,
        "url": url_link,
        "name": name,
        "summary": summary
    }
}

function makeQuestion(username, domain, guid, params){
    const { questiontype, options, content, sensitive, published, url, closed, to, cc, public, followshare } = params;
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
        "sensitive": sensitive,
        "content": content
    }
    if(closed){
        obj["closed"] = closed;
    }
    //const parsed_options = JSON.parse(options);

    var parsed_options;
    if(options && options != null){
        var opts = options;
        if(!Array.isArray(options)){
            opts = new Array(options)
        }
        parsed_options = new Array();
        for(let i = 0; i < opts.length; i++){
            if(opts[i] !== undefined){
                var o = {};
                o.type = "Note";
                o.name = opts[i];
                parsed_options.push(o)
            }
        }
    }

    if(questiontype == "anyOf"){
        obj["anyOf"] = parsed_options;
    }else if(questiontype == "oneOf"){
        obj["oneOf"] = parsed_options;
    }

    return obj;
}

function makeImage(username, domain, guid, params){
    const { name, href, to, cc, mediaType, inReplyTo, sensitive, url, public, followshare } = params;
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
    obj["sensitive"] = sensitive;
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