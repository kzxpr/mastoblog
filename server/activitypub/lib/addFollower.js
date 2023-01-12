const db = require("./../../../knexfile")
const knex = require("knex")(db)
const crypto = require('crypto');

async function addFollower(username, follower){
    // Add the user to the DB of accounts that follow the account
    // get the followers JSON for the user
    // Check if user exists
    
    const guid = crypto.randomBytes(16).toString('hex');
    let newFollowers = await knex("apfollowers").insert({"guid": guid, username, "follower": follower, createdAt: knex.fn.now() })
        .onConflict(['user', 'follower'])
        .ignore()
        .catch((e) => {
            console.error("Uncaught error inside addFollower", e)
        })
}

async function removeFollower(username, follower){
    return new Promise(async(resolve, reject) => {
        await knex("apfollowers")
            .where("username", "=", username)
            .andWhere("follower", "=", follower)
            .delete()
            .then((d) => {
                resolve()
            })
            .catch((e) => {
                console.error("Uncaught error inside removeFollower", e)
                reject()
            })
    });
}

module.exports = { addFollower, removeFollower }