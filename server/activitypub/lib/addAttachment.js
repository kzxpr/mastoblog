const db = require("./../../../knexfile")
const knex = require("knex")(db)

function parseAttachment(attachment){
    var obj = {};
    obj.type = attachment.type ? attachment.type : "";
    obj.mediaType = attachment.mediaType ? attachment.mediaType : "";
    obj.url = attachment.url ? attachment.url : "";
    obj.name = attachment.name ? attachment.name : null;
    obj.blurhash = attachment.blurhash ? attachment.blurhash : null;
    obj.width = attachment.width ? attachment.width : null;
    obj.height = attachment.height ? attachment.height : null;
    return obj;
}

async function addAttachment(message_uri, attachment){
    return new Promise(async(resolve, reject) => {
        const parsedAttachment = parseAttachment(attachment)
        await knex("apattachments").insert({
            message_uri: message_uri,
            ... parsedAttachment,
            createdAt: knex.fn.now()
        })
        .then((data) => {
            resolve(data)
        })
        .catch((e) => {
            reject(e)
        })
    })
}

module.exports = { addAttachment };