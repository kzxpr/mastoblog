const db = require("./../../../knexfile")
const knex = require("knex")(db)
const crypto = require('crypto');

async function addFollower(username, follower){
    // Add the user to the DB of accounts that follow the account
    // get the followers JSON for the user
    // Check if user exists

    // "@"+username+"@"+domain
    
    const guid = crypto.randomBytes(16).toString('hex');
    let newFollowers = await knex("apfollowers").insert({"guid": guid, username, "follower": follower, createdAt: knex.fn.now() })
        .onConflict(['user', 'follower'])
        .ignore()
        .catch((e) => {
            console.error("Uncaught error inside addFollower", e)
        })

    /*
    const result = await knex("apaccounts").where("username", "=", "@"+username+"@"+domain).select("username").first();
    if (result === undefined) {
        console.log("No record found for @"+username+"@"+domain);
    } else {
        // update followers
        console.log("Add follower",follower)
        try {
            // update into DB
            const guid = crypto.randomBytes(16).toString('hex');
            let newFollowers = await knex("apfollowers").insert({"guid": guid, username, "follower": follower, createdAt: knex.fn.now() })
            .onConflict(['user', 'follower'])
            .ignore()
        } catch(e) {
            console.log('error', e);
        }
    }*/
}

module.exports = { addFollower }