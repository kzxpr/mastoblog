const db = require("./../../../knexfile")
const knex = require("knex")(db)

async function loadFollowersByUsername(username, domain){
    return new Promise(async (resolve, reject) => {
        const followers = await knex("apfollowers").where("username", "=", username).select("follower")
        .then(function(rows){
            const followers = rows.map(function(v){
                return v.follower;
            })
            let followersCollection = {
                "@context":["https://www.w3.org/ns/activitystreams"],
                "type":"OrderedCollection",
                "totalItems":followers.length,
                "id":`https://${domain}/u/${username}/followers`,
                "first": {
                    "type":"OrderedCollectionPage",
                    "totalItems":followers.length,
                    "partOf":`https://${domain}/u/${username}/followers`,
                    "orderedItems": followers,
                    "id":`https://${domain}/u/${username}/followers?page=1`
                }
            };
            resolve(followersCollection)
        })
    })
}

module.exports = { loadFollowersByUsername }