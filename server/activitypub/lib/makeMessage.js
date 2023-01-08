function makeMessage(uri, guid, params){
    const { published, content, url, cc } = params;
    var url_link;
    if(!url){
        url_link = uri+"/statuses/"+guid;
        message_uri = uri+"/statuses"+guid;
    }else{
        url_link = url;
        message_uri = url;
    }
    var cc_list = new Array(uri+"/followers")
    if(cc){
        cc_list.push(cc)
    }
    return {
        "@context": ["https://www.w3.org/ns/activitystreams"],
        "id": message_uri,
        "type": "Note",
        "published": published,
        "attributedTo": uri,
        "to": [
            "https://www.w3.org/ns/activitystreams#Public"
        ],
        "cc": cc_list,
        "url": url_link,
        "content": content,
        "contentMap": {
            "en": content
        }
    }
}

function makeNote(username, domain, guid, params){
    const { published, name, content, to, cc, url, summary, inReplyTo } = params;
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
    if(to){
        obj["to"] = [ to ];
    }
    if(cc){
        obj["cc"] = [ cc ];
    }
    obj["url"] = url_link;
    if(inReplyTo){
        obj["inReplyTo"] = inReplyTo;
    }
    obj["summary"] = summary;
    obj["content"] = content;
    obj["contentMap"] = { "en": summary };
    return obj;
}

function makeArticle(username, domain, guid, params){
    const {published, content, name, url} = params;
    var url_link;
    if(!url){
        url_link = "https://"+domain+"/u/"+username+"/statuses/"+guid;
    }else{
        url_link = url;
    }
    return {
        "@context": ["https://www.w3.org/ns/activitystreams"],
        "id": "https://"+domain+"/u/"+username+"/statuses/"+guid,
        "type": "Article",
        "published": published,
        "attributedTo": "https://"+domain+"/u/"+username,
        "to": [
            "https://www.w3.org/ns/activitystreams#Public"
        ],
        "cc": [
            "https://"+domain+"/u/"+username+"/followers"
        ],
        "url": url_link,
        "name": name,
        "content": content,
        "contentMap": {
            "en": content
        }
    }
}

function makeEvent(username, domain, guid, params){
    const { startTime, endTime, name, published, url, summary, to, cc } = params;
    var url_link;
    if(!url){
        url_link = "https://"+domain+"/u/"+username+"/statuses/"+guid;
    }else{
        url_link = url;
    }
    return {
        "@context": ["https://www.w3.org/ns/activitystreams"],
        "id": "https://"+domain+"/u/"+username+"/statuses/"+guid,
        "type": "Event",
        "published": published,
        "startTime": startTime,
        "endTime": endTime,
        "attributedTo": "https://"+domain+"/u/"+username,
        "to": [
            to
        ],
        "cc": [
            cc
        ],
        "url": url_link,
        "name": name,
        "summary": summary
    }
}

function makeQuestion(username, domain, guid, params){
    const { anyOf, oneOf, content, published, url, closed, to, cc } = params;
    var url_link;
    if(!url){
        url_link = "https://"+domain+"/u/"+username+"/statuses/"+guid;
    }else{
        url_link = url;
    }
    var obj = {
        "@context": ["https://www.w3.org/ns/activitystreams"],
        "id": "https://"+domain+"/u/"+username+"/statuses/"+guid,
        "type": "Question",
        "published": published,
        "attributedTo": "https://"+domain+"/u/"+username,
        "to": [
            to
        ],
        "cc": [
            cc
        ],
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
    const { name, href, to, cc, mediaType, inReplyTo, url } = params;
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
    obj["to"] = [ to ];
    obj["cc"] = [ cc ];
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

module.exports = { makeMessage, makeArticle, makeEvent, makeNote, makeQuestion, makeImage }