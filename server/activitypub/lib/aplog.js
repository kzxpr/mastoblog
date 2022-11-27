const db = require("./../../../knexfile")
const knex = require("knex")(db)

async function startAPLog(req){
    const ip = req.ip;
    const params = JSON.stringify(req.params)
    const body = JSON.stringify(req.body)
    const query = JSON.stringify(req.query)
    const url = req.originalUrl;
    const method = req.method;
    return new Promise(async(resolve, reject) => {
        await knex("aprequests").insert({
            ip,
            timestamp: knex.fn.now(),
            url,
            method,
            params,
            body,
            query,
            statuscode: -1
        })
        .then((d) => {
            resolve(d[0])
        })
        .catch((e) => {
            console.error("ERROR logging AP request", e)
            reject(e)
        })
    });
}

async function endAPLog(log_id, response, statuscode = 200){
    const resp = JSON.stringify(response)
    await knex("aprequests").update({
        response: resp, statuscode
    }).where("id", "=", log_id)
    .then((e) => {
        //SILENT
    })
    .catch((e) => {
        console.error("ERROR logging AP end", e)
    })
}

module.exports = { startAPLog, endAPLog }