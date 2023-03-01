const db = require("./../../../knexfile")
const knex = require("knex")(db)

const { wrapInOrderedCollection } = require("./wrappers")

async function loadFollowersByUri(account_uri, page = 0){
    console.log("NU")
    return new Promise(async (resolve, reject) => {
        const followers = await knex("apfollowers")
            .where("username", "=", account_uri).select("follower")
            //.limit(10).offset(10*(page-1))
        .then(function(rows){
            const followers = rows.map(function(v){
                return v.follower;
            })

            var id = account_uri + "/followers"
            /*if(page==0){
                // wrap in collection
                
            }else{
                // wrap in page
                id = id+"?page="+page;
            }*/
            const followersCollection = wrapInOrderedCollection(id, followers, { wrapInFirst: true })
            resolve(followersCollection)
        })
        .catch((e) => {
            console.log(e)
            reject({ statuscode: 500, msg: "DB Error in loadFollowersByUri"})
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

module.exports = { loadFollowersByUri, loadFollowingByUri }