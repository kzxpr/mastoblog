const db = require("./../../../knexfile")
const knex = require("knex")(db)

async function loadWebfingerByUsername(username, domain){
    console.log("Loading webfinger for", username)
    return new Promise(async (resolve, reject) => {
        const result = await knex("apaccounts").where("username", "=", username).select("username").first()
        .then((result) => {
            if (result === undefined) {
                reject({statuscode: 404, msg: "No record found for "+username })
            } else {
                let webfinger = {};
                webfinger.subject = "acct:"+username+"@"+domain;
                //webfinger.icon = "https://"+domain+"/public/007.png"
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
                //console.log(webfinger)
                console.log("Resolved webfinger!")
                resolve(webfinger)
            }
        })
        .catch((err) => {
            reject({statuscode: 400, msg: "Error in database, looking up webfinger for "+username})
        })
    })   
}

/*async function loadWebfingerByName(name, domain){
    return new Promise(async (resolve, reject) => {
      const result = await knex("apaccounts").where("name", "=", name+"@"+domain).select("username").first()
        .then((result) => {
          if (result === undefined) {
            reject({statuscode: 404, msg: "No record found for "+name })
          } else {
            let webfinger = {};
            webfinger.subject = "acct:"+name+"@"+domain;
            webfinger.links = new Array();
            let selflink = {
              "rel": "self",
              "type": "application/activity+json",
              "href": "https://"+domain+"/u/"+name
            }
            webfinger.links.push(selflink);
            //console.log(webfinger)
            resolve(webfinger)
          }
        })
        .catch((err) => {
          reject({statuscode: 400, msg: "Error in database, looking up webfinger for "+name})
        })
    })
  }*/

module.exports = { loadWebfingerByUsername }