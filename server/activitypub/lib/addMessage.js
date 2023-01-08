const db = require("./../../../knexfile")
const knex = require("knex")(db)
const { encodeStr } = require("./addAccount")

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
    return { uri, type, summary, inReplyTo, publishedAt, url, attributedTo, content, name }
}

function parseAddressees(arr, field){
    var list = new Array();
    for(let user_uri of arr){
        list.push({
            account_uri: user_uri,
            field,
            type: '0'
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
                    if(parsedMessage.publishedAt===null){
                        parsedMessage.publishedAt=knex.fn.now();
                    }
                    await knex("apmessages").insert({
                        guid,
                        ... parsedMessage,
                        createdAt: knex.fn.now()
                    })
                    .then(async(ids) => {
                        console.log("Added message "+message.id)
                        const addressees = extractAddressee(message)
                        for(let addr of addressees){
                            await knex("apaddressee").insert({ ...addr, message_uri: message.id, createdAt: knex.fn.now() })
                            .catch((e) => {
                                console.error("ERROR on inserting apaddressee", addr)
                            })
                            .then((data) => {
                                console.log("Added addressees for message",message.id+"!")
                            })
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

module.exports = { addMessage, parseMessage, unwrapMessage }