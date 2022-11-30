function makeMessage(username, domain, guid, publishedAt, content, url = ""){
    var url_link;
    if(!url){
        url_link = "https://"+domain+"/u/"+username+"/statuses/"+guid;
    }else{
        url_link = url;
    }
    return {
        "@context": ["https://www.w3.org/ns/activitystreams"],
        "id": "https://"+domain+"/u/"+username+"/statuses/"+guid,
        "type": "Note",
        "published": publishedAt,
        "attributedTo": "https://"+domain+"/u/"+username,
        "to": [
            "https://www.w3.org/ns/activitystreams#Public"
        ],
        "cc": [
            "https://"+domain+"/u/"+username+"/followers"
        ],
        "url": url_link,
        "content": content,
        "contentMap": {
            "en": content
        }
    }
}

function makePage(username, domain, guid, publishedAt, content, url = ""){
    var url_link;
    if(!url){
        url_link = "https://"+domain+"/u/"+username+"/statuses/"+guid;
    }else{
        url_link = url;
    }
    return {
        "@context": ["https://www.w3.org/ns/activitystreams"],
        "id": "https://"+domain+"/u/"+username+"/statuses/"+guid,
        "type": "Page",
        "published": publishedAt,
        "attributedTo": "https://"+domain+"/u/"+username,
        "to": [
            "https://www.w3.org/ns/activitystreams#Public"
        ],
        "cc": [
            "https://"+domain+"/u/"+username+"/followers"
        ],
        "url": url_link,
        "content": content,
    }
}

function makeArticle(username, domain, guid, publishedAt, content, name, url = ""){
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
        "published": publishedAt,
        "attributedTo": "https://"+domain+"/u/"+username,
        "to": [
            "https://www.w3.org/ns/activitystreams#Public"
        ],
        "cc": [
            "https://"+domain+"/u/"+username+"/followers"
        ],
        "url": url_link,
        "content": content,
        "contentMap": {
            "en": content
        }
    }
}

module.exports = { makeMessage, makePage, makeArticle }