const db = require("./../../../knexfile")
const knex = require("knex")(db)

async function loadActorByUsername(username, domain){
    console.log("\x1b[33m%s\x1b[0m", "PROFILE", "for", username, domain)
    return new Promise(async (resolve, reject) => {
        await knex("apaccounts").where("handle", "=", username+"@"+domain).first()
        .then((result) => {
            if (result === undefined) {
                reject({statuscode: 404, msg: "No account found for "+username})
            } else {
                let tempActor = {};

                // THIS IS DESCRIBED FOR MASTODON AS "PROFILE":
                // SEE https://docs.joinmastodon.org/spec/activitypub/#profile
                //
                // See example here: https://www.w3.org/TR/activitypub/#liked

                const context_featured = {
                    "toot": "http://joinmastodon.org/ns#",
                    "featured": {
                      "@id": "toot:featured",
                      "@type": "@id"
                    }
                  };
                tempActor["@context"] = new Array("https://www.w3.org/ns/activitystreams", "https://w3id.org/security/v1", context_featured);
                tempActor["id"] = "https://"+domain+"/u/"+username;
                tempActor["name"] = result.displayname ? result.displayname : username;
                tempActor["summary"] = result.summary;
                tempActor["url"] = "https://"+domain+"/?user="+username;
                tempActor["type"] = "Person";
                tempActor["preferredUsername"] = username;
                tempActor["discoverable"] = true;

                /* LINKS */
                tempActor["followers"] = "https://"+domain+"/u/"+username+"/followers"
                tempActor["following"] = "https://"+domain+"/u/"+username+"/following"
                tempActor["featured"] = "https://"+domain+"/u/"+username+"/collections/featured"
                tempActor["liked"] = "https://"+domain+"/u/"+username+"/liked";
                tempActor["inbox"] = "https://"+domain+"/u/"+username+"/inbox";
                tempActor["outbox"] = "https://"+domain+"/u/"+username+"/outbox";
                // Added this followers URI for Pleroma compatibility, see https://github.com/dariusk/rss-to-activitypub/issues/11#issuecomment-471390881
                // New Actors should have this followers URI but in case of migration from an old version this will add it in on the fly
                if (tempActor.followers === undefined) {
                    tempActor.followers = "https://"+domain+"/u/"+username+"/followers";
                }

                tempActor["endpoints"] = {
                    "sharedInbox": "https://"+domain+"/u/inbox"
                }

                /* EXTENDED */
                tempActor["icon"] = {};
                tempActor["icon"].type = "Image";
                if(!result.icon){
                    tempActor["icon"].mediaType = "image/png";
                    tempActor["icon"].url = "https://"+domain+"/public/icon128.png"
                }else{
                    if(result.icon.substr(-4)==".png"){
                        tempActor["icon"].mediaType = "image/png";
                        tempActor["icon"].url = result.icon;
                    }else if(result.icon.substr(-4)==".jpg"){
                        tempActor["icon"].mediaType = "image/jpg";
                        tempActor["icon"].url = result.icon;
                    }
                }

		
        		if(!result.image){

		        }else{
                    tempActor["image"] = {};
                    tempActor["image"].type = "Image";
                    tempActor["image"].mediaType = "image/jpeg";
                    tempActor["image"].url = "https://"+domain+"/public/"+result.image;
                }

                var attachment = new Array();
                if(result.homepage){
                    attachment.push({
                        "type": "PropertyValue",
                        "name": "Homepage",
                        "value": "<a href='"+result.homepage+"' rel='me nofollow noopener noreferrer' target='_blank'>"+result.homepage+"</a>"
                    })
                }
                        
                tempActor["attachment"] = attachment
                tempActor["publicKey"] = {};
                tempActor["publicKey"].id = "https://"+domain+"/u/"+username+"#main-key";
                tempActor["publicKey"].owner = "https://"+domain+"/u/"+username;
                tempActor["publicKey"].publicKeyPem = result.pubkey;

                resolve(tempActor);
            }
        })
        .catch((err) => {
            reject({statuscode: 400, msg: "Error connecting to database, while looking up: "+name})
        })
    })
}

module.exports = { loadActorByUsername }