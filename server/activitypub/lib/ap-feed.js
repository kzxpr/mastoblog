const axios = require('axios');

function getFollowed(){
    return ["test@hackademiet.dk", "AMOK@todon.nl"];//, "kzxpr@todon.eu"];//, "NOISEBOB@todon.nl", "djhnm@www.yiny.org", "NilsenMuseum@mastodon.social", "pxsx@todon.nl"]; //"asbjorn@norrebro.space", "apconf@conf.tube", "schokoladen@mobilize.berlin", "kzasdxpr@todon.eu"];
}

async function getWebfinger(address){
    const parts = address.split("@");
    const url = "https://"+parts[1]+"/.well-known/webfinger/?resource=acct:"+address;
    console.log("LOOKUP", url)
    return new Promise((resolve, reject) => {
        axios
            .get(url)
            .then(res => {
                if(res.status==200){
                    resolve(res.data);
                }else{
                    reject("Not resolved (statuscode: "+res.status+")")
                }
            })
            .catch(error => {
                reject("Error in axios"+error)
            });
    });
}

async function getOutboxFirst(outbox){
    return new Promise(async (resolve, reject) => {
        if(typeof outbox.first == "object"){
            resolve(outbox.first.orderedItems)
        }else if(typeof outbox.first == "string"){
            const items = await getOutboxItems(outbox.first)
            resolve(items)
        }else{
            reject("Not recognized 'first' in outbox...")
        }
    });
}

function readLinkFromWebfinger(webfinger, rel){
    return new Promise((resolve, reject) => {
        for(let link of webfinger.links){
            if(link.rel==rel){
                resolve(link);
            }
        }
        reject("Could not find "+link+" in webfinger")
    })
}

async function getObjectItem(url, headers){
    if(url && url != "https://www.w3.org/ns/activitystreams#Public"){
        console.log("RUnning getObjectItem", url, headers)
        return new Promise((resolve, reject) => {
            axios({
                method: 'GET',
                headers,
                url
            })
                .then(res => {
                    if(res.status==200){
                        resolve(res.data);
                    }else{
                        reject("getObjectItem not resolved (statuscode: "+res.status+")")
                    }
                })
                .catch(error => {
                    reject("Error in axios"+error)
                });
        });
    }
}

async function getOutboxItems(url){
    return new Promise((resolve, reject) => {
        axios
            .get(url)
            .then(res => {
                if(res.status==200){
                    resolve(res.data.orderedItems);
                }else{
                    reject("getOutboxItems not resolved (statuscode: "+res.status+")")
                }
            })
            .catch(error => {
                reject("Error in axios"+error)
            });
    });
}

async function getStreamFromUserBase(stream, user_base){
    const url = user_base + "/" + stream;
    console.log(url)
    return new Promise((resolve, reject) => {
        axios({
            method: 'GET',
            url,
            headers: {
                Accept: 'application/activity+json',
            }
        })
            .then(res => {
                if(res.status==200){
                    resolve(res.data);
                }else{
                    reject("Not resolved (statuscode: "+res.status+")")
                }
            })
            .catch(error => {
                reject("Error in axios"+error)
            });
    });
}

async function getWebfingerByFollow(follow){
    return new Promise(async (resolve, reject) => {
        const webfinger = await getWebfinger(follow).then((webfinger) => {
        const self = readLinkFromWebfinger(webfinger, "self")
            .then(async(self) => {
                let obj = {};
                obj[follow] = self.href;
                resolve(obj);
            })
            .catch((err) => {
                reject(err)
            })
        
        })
        .catch((err) => {
            reject({msg: "ERROR RESOLVING WEBFINGER: "+follow+": "+err})
        })
    });
}

async function findFollowedOutbox(user_base){
    return new Promise(async (resolve, reject) => {
        const outbox = await getStreamFromUserBase("outbox", user_base)
        .then((outbox) => {
            console.log("OUTBOX", outbox)
            getOutboxFirst(outbox)
            .then((posts) => {
                resolve(posts);
            })
            .catch((err) => {
                reject("Found no posts for "+follows)
            })
        })
        .catch((err) => {
            reject("Error fetching outbox: "+err)
        })                
    })
    .catch((err) => {
        reject(err)
    })
}

async function getWebfingersByFollows(follows_ids){
    return new Promise(async (resolve, reject) => {
        let follows = {};
        for(let follow of follows_ids){
            await getWebfingerByFollow(follow)
            .then((data) => {
                for(let d in data){
                    //console.log("I", d, data[d])
                    follows[d] = data[d]
                }
            })
            .catch((err) => {
                console.log(err)
            })
        }
        resolve(follows);
    })
}

async function makeMyFeed(req, res){
    var errs = new Array();
    var body = new Array();
    const follows_ids = getFollowed();
    const follows = await getWebfingersByFollows(follows_ids)
    .then(async (follows) => {
        for(let f in follows){
            const user_base = follows[f]
            console.log(user_base)
            await findFollowedOutbox(user_base)
            .then(async (posts) => {
                for(let post of posts){
                    console.log(post)
                    if(post.type=="Announce"){
                        //console.log("ANNOUNCE",post)
                        const test = await getObjectItem(post.object, {});
                        //console.log("T",test)
                        //body.push(post);
                    }else if(post.type=="Create"){
                        //console.log("CREATE")
                        body.push(post);
                    }else{
                        console.log("Post type not recognized: "+post.type)
                    }
                }
            })
            .catch((err) => {
                errs.push(err)
            })
        }
        //console.log(body)
        let posts = body.sort((a,b) => {
            return 1 - Math.random() * 2;
            //console.log(a.published, b.published)
            //if (a.published > b.published) { return -1; } if (a.published < b.published) { return 1; } return 0;
        })

        //console.log(posts)
        const result = { posts, users: follows }
        //res.send(result)
        res.render("feed", { data: result, status: errs })
    })
}

module.exports = { makeMyFeed, getWebfinger, getStreamFromUserBase, readLinkFromWebfinger, getObjectItem }