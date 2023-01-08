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

async function loadFollowersByUri(uri){
    return new Promise(async (resolve, reject) => {
        const followers = await knex("apfollowers").where("username", "=", uri).select("follower")
        .then(function(rows){
            const followers = rows.map(function(v){
                return v.follower;
            })
            let followersCollection = {
                "@context":["https://www.w3.org/ns/activitystreams"],
                "type":"OrderedCollection",
                "totalItems":followers.length,
                "id": uri+"/followers",
                "first": {
                    "type":"OrderedCollectionPage",
                    "totalItems":followers.length,
                    "partOf": uri+"/followers",
                    "orderedItems": followers,
                    "id": uri+"/followers?page=1"
                }
            };
            resolve(followersCollection)
        })
    })
}

async function loadFollowingByUri(uri){
    return new Promise(async (resolve, reject) => {
        const followers = await knex("apfollowers").where("follower", "=", uri).select("username")
        .then(function(rows){
            const followings = rows.map(function(v){
                return v.username;
            })
            let followingCollection = {
                "@context":["https://www.w3.org/ns/activitystreams"],
                "type":"OrderedCollection",
                "totalItems":followings.length,
                "id": uri+"/following",
                "first": {
                    "type":"OrderedCollectionPage",
                    "totalItems":followings.length,
                    "partOf": uri+"/following",
                    "orderedItems": followings,
                    "id": uri+"/following?page=1"
                }
            };
            resolve(followingCollection)
        })
    })
}

module.exports = { loadFollowersByUsername, loadFollowersByUri, loadFollowingByUri }