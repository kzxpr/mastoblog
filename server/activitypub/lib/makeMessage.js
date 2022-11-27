function makeMessage(username, domain, guid, publishedAt, content){
    /* "id": "https://"+domain+"/u/"+username+"/messages/"+guid+"/activity",
        "type": "Create",
        "actor": "https://"+domain+"/u/"+username,
        "published": publishedAt,
        "to": [
            "https://www.w3.org/ns/activitystreams#Public"
        ],
        "cc": [
            "https://"+domain+"/u/"+username+"/followers"
        ],
        "object": { */
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
            "url": "https://"+domain+"/@"+username+"/"+guid,
            "content": content,
            "contentMap": {
                "en": content
            }
        
    }
}

module.exports = { makeMessage }