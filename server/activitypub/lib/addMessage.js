const db = require("./../../../knexfile")
const knex = require("knex")(db)
const { encodeStr, findFollowers } = require("./addAccount")
const { addAttachment } = require("./addAttachment")
const { addTag } = require("./addTag")

function unwrapMessage(obj){
    //console.log("UNWRAP", obj)
    if(typeof obj.object === "object"){
        console.log("UNWRAPPED")
        return obj.object;
    }else{
        return obj;
    }
}

function parseMessage(message){
    const uri = message.id;
    const type = message.type;
    const summary = message.summary
        ? encodeStr(message.summary)
        : null;
    const inReplyTo = message.inReplyTo
        ? message.inReplyTo
        : null;
    const publishedAt = message.published
        ? date2mysql(message.published)
        : null;
    const url = message.url
        ? message.url
        : null;
    const attributedTo = message.attributedTo;
    const content = message.content
        ? encodeStr(message.content)
        : null;
    const name = message.name
        ? encodeStr(message.name)
        : null;
    const replies_uri = ((message.replies) && (message.replies.id))
        ? message.replies.id
        : null;
    return { uri, type, summary, inReplyTo, publishedAt, url, attributedTo, content, name, replies_uri }
}

function parseAddressees(arr, field){
    var list = new Array();
    for(let user_uri of arr){
        list.push({
            account_uri: user_uri,
            field
        })
    }
    return list
}

function extractAddressee(message){
    var addressees = new Array();
    if(message.to && message.to.length>0){
        addressees = addressees.concat(parseAddressees(message.to, 'to'))
    }
    if(message.cc && message.cc.length>0){
        addressees = addressees.concat(parseAddressees(message.cc, 'cc'))
    }
    if(message.bcc && message.bcc.length>0){
        addressees = addressees.concat(parseAddressees(message.bcc, 'bcc'))
    }
    return addressees;
}

function date2mysql(d){
    return new Date(d).toISOString().slice(0, 19).replace('T', ' ');
}

async function addMessage(message){
    //console.log("Triggered addMessage with", message)
    return new Promise(async(resolve, reject) => {
        if(message){
            await knex("apmessages").where("uri", "=", message.id).select("id")
            .then(async(rows) => {
                if(rows.length==0){
                    const guid = crypto.randomBytes(16).toString('hex');
                    const parsedMessage = parseMessage(message);
                    if(parsedMessage.type=="Announce"){
                        console.warn("WAS SENT ANNONCE - IT WAS IGNORED")
                        reject("THIS IS AN ANNOUNCE!!!!")
                    }
                    if(parsedMessage.publishedAt===null){
                        parsedMessage.publishedAt=knex.fn.now();
                    }
                    
                    // Extract the URIs in 'to', 'cc' and 'bcc' into one array (addressees)
                    const addressees = extractAddressee(message)
                    const address_list = addressees.map((addr) => {
                        return addr.account_uri;
                    })
                    //console.log("FOUND ADDR", address_list)

                    // check for public group addressees
                    const public_test = address_list.includes("https://www.w3.org/ns/activitystreams#Public")

                    // find the creator's follower_uri, save it to "followshare_addr" and check for follower group in addressees
                    const { followshare_test, followshare_addr } = await findFollowers(parsedMessage.attributedTo)
                    .then((follower_uri) => {
                        console.log("addMessage resolved follower_uri as:",follower_uri)
                        return {
                            followshare_test: address_list.includes(follower_uri),
                            followshare_addr: follower_uri
                        };
                    })
                    .catch((e) => {
                        console.error("ERROR in addMessage resolving follower_uri")
                        return {
                            followshare_test: false,
                            followshare_addr: ""
                        }
                    })

                    // Validate results of public_test and followshare_test
                    var public = 0;
                    var followshare = 0;
                    if(public_test){
                        public = 1;
                    }
                    if(followshare_test){
                        followshare = 1;
                    }

                    // Insert parsed message into apmessage
                    await knex("apmessages").insert({
                        guid,
                        ... parsedMessage,
                        public,
                        followshare,
                        createdAt: knex.fn.now()
                    })
                    .onConflict("uri").ignore()
                    .then(async(ids) => {
                        // I'm wrapping in this in if(ids), because I think an "ignore" would actually also trigger a "then"
                        if(ids){
                            console.log("Added message "+message.id)

                            // ADDRESSEES
                            for(let addr of addressees){
                                // evaluate the type of address (0 = normal, 1 = public group, 2 = follower group)
                                var type = 0;
                                if(addr.account_uri=="https://www.w3.org/ns/activitystreams#Public"){
                                    type = 1;
                                }else if(addr.account_uri==followshare_addr){
                                    type = 2;
                                }
                                await knex("apaddressee").insert({ ...addr, type, message_uri: message.id, createdAt: knex.fn.now() })
                                    .onConflict(["message_uri", "account_uri"]).ignore()
                                    .then((data) => {
                                        console.log("Added addressees for message",message.id+"!")
                                    })
                                    .catch((e) => {
                                        console.error("ERROR on inserting apaddressee", addr)
                                    })
                            }

                            // ATTACHMENTS
                            if(message.attachment && message.attachment.length>0){
                                for(let attachment of message.attachment){
                                    await addAttachment(message.id, attachment)
                                        .then((data) => {
                                            //console.log("Added attachment")
                                        })
                                        .catch((e) => {
                                            console.error("ERROR in adding attachment", attachment)
                                        })
                                }
                            }

                            // TAGS
                            if(message.tag && message.tag.length>0){
                                for(let tag of message.tag){
                                    await addTag(message.id, tag)
                                        .then((data) => {
                                            //console.log("Added tag")
                                        })
                                        .catch((e) => {
                                            console.error("ERROR in adding tag", tag)
                                        })
                                }
                            }
                        }
                        resolve(ids)
                    })
                    .catch((e) => {
                        console.error("ERROR in addMessage", e)
                        reject("ERROR in addMessage")
                    })
                }else{
                    resolve(rows)
                }
            })
            .catch((e) => {
                console.error("ERROR in addMessage looking up", e)
                reject("ERR in addMessage")
            })
            
        }else{
            reject("No message sent to addMessage!")
        }
    })
}

async function removeMessage(message_uri, creator_uri){
    console.log("TRIGGER removeMessage", message_uri, creator_uri)
    return new Promise(async(resolve, reject) => {
        await knex("apmessages")
        .where("attributedTo", "=", creator_uri)
        .andWhere("uri", "=", message_uri)
        .first()
        .delete()
        .then((rows) => {
            resolve("removeMessage: "+rows+" row removed for "+message_uri)
        })
        .catch((e) => {
            reject(e);
        })
    });
}

async function updateMessage(message){
    return new Promise(async(resolve, reject) => {
        const message_uri = message.id;
        await knex("apmessages")
            .where("uri", "=", message_uri)
            .select("id")
            .first()
            .then(async(message_id) => {
                if(message_id){
                    const parsedMessage = parseMessage(message)
                    await knex("apmessages")
                    .update({
                        ... parsedMessage,
                        updated: knex.fn.now()
                    })
                    .where("id", "=", message_id.id)
                    .andWhere("attributedTo", "=", parsedMessage.attributedTo)
                    .then(async(msg) => {
                        resolve("UPDATED message "+message_uri+": "+msg)
                    })
                    .catch((e) => {
                        reject("ERROR in updateMessage"+e)
                    })
                }else{
                    await addMessage(message)
                        .then((msg) => {
                            console.log("Update object not found. Adding message "+message_uri)
                            resolve("Update object not found. Adding message "+message_uri)
                        })
                        .catch((e) => {
                            reject("Update object not found. ERROR adding message to DB")
                        })
                }
            })
    })
}

module.exports = { addMessage, parseMessage, unwrapMessage, removeMessage, updateMessage }