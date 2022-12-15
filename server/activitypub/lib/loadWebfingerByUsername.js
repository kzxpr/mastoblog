const db = require("./../../../knexfile")
const knex = require("knex")(db)

async function loadWebfingerByUsername(username, domain){
  console.log("Loading webfinger for", username)
  return new Promise(async (resolve, reject) => {
    const result = await knex("apaccounts").where("username", "=", "@"+username+"@"+domain).select("username").first()
      .then((result) => {
        if (result === undefined) {
          reject({statuscode: 404, msg: "No record found for "+username })
        } else {
          let webfinger = {};
          webfinger.subject = "acct:"+username+"@"+domain;
          webfinger.links = new Array();
          let selflink = {
            "rel": "self",
            "type": "application/activity+json",
            "href": "https://"+domain+"/u/"+username
          }
          let profilelink = {
            "rel": "http://webfinger.net/rel/profile-page",
            "type": "text/html",
            "href": "https://"+domain+"/u/"+username+"/profile"
          }
          webfinger.links.push(selflink, profilelink);
          resolve(webfinger)
        }
      })
      .catch((err) => {
        reject({statuscode: 400, msg: "Error in database, looking up webfinger for "+username})
      })
    })
  }

module.exports = { loadWebfingerByUsername }