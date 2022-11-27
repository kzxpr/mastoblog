const db = require("./../../../knexfile")
const knex = require("knex")(db)
crypto = require('crypto');

async function createNote(content, username, domain){
  return new Promise(async (resolve, reject) => {
    console.log("/createNote?")
    const guidNote = crypto.randomBytes(16).toString('hex');
    let d = new Date();

    const user_id = await knex("apaccounts").where("username", "=", username).select("id").first()
    .then((d) => {
      return d.id;
    })
    .catch((e) => {
      console.error("ERROR", e)
    })
    const type = "Note";
    const attributedTo = user_id;
  
    let status2 = knex("apmessages")
      .insert({ guid: guidNote, type, publishedAt: knex.fn.now(), attributedTo, content })
      .then((d) => {
        resolve(d)
      })
      .catch(function(e){
          reject(e)
      })
      
  })
}

module.exports = { createNote }