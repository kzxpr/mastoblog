const db = require("./../../../knexfile")
const knex = require("knex")(db)

async function loadActorByUsername(username, domain){
    return new Promise(async (resolve, reject) => {
        await knex("apaccounts").where("username", "=", username).select("pubkey").first()
        .then((result) => {
            if (result === undefined) {
                reject({statuscode: 404, msg: "No record found for "+username})
            } else {
                let tempActor = {};
                
                const preferredUsername = result.displayname ? result.displayname : username;
                tempActor["@context"] = new Array("https://www.w3.org/ns/activitystreams", "https://w3id.org/security/v1");
                tempActor["id"] = "https://"+domain+"/u/"+username;
                tempActor["type"] = "Person";
                tempActor["preferredUsername"] = preferredUsername;
                tempActor["inbox"] = "https://"+domain+"/api/inbox";
                //tempActor["followers"] = "https://"+domain+"/u/"+username+"/followers"
                tempActor["publicKey"] = {};
                tempActor["publicKey"].id = "https://"+domain+"/u/"+username+"#main-key";
                tempActor["publicKey"].owner = "https://"+domain+"/u/"+username;
                tempActor["publicKey"].publicKeyPem = result.pubkey;
                
                // Added this followers URI for Pleroma compatibility, see https://github.com/dariusk/rss-to-activitypub/issues/11#issuecomment-471390881
                // New Actors should have this followers URI but in case of migration from an old version this will add it in on the fly
                if (tempActor.followers === undefined) {
                    tempActor.followers = `https://${domain}/u/${username}/followers`;
                }
                resolve(tempActor);
            }
        })
        .catch((err) => {
            reject({statuscode: 400, msg: "Error connecting to database, while looking up: "+name})
        })
    })
}

module.exports = { loadActorByUsername }