const db = require("./../../../knexfile")
const knex = require("knex")(db)
const crypto = require('crypto');
const { getWebfinger, getStreamFromUserBase, getLinkInWebfinger } = require("./ap-feed")

async function addAccount(username, domain){
    return new Promise(async(resolve, reject) => {
        await getWebfinger(username+"@"+domain).then(async(webfinger) => {
            console.log("FOUND WEBFINGER", webfinger)
            const user_self = await getLinkInWebfinger(webfinger, "self")
            const user_base = user_self.href;
            console.log("FOUND USERBASE", user_base)
            await getStreamFromUserBase("", user_base).then(async(profile) => {
                const { id, type, preferredUsername, name, summary, url, published, publicKey, icon } = profile;
                const account = { displayname: name, published, pubkey: publicKey.publicKeyPem, icon: icon.url, summary, homepage: url }
                await knex("apaccounts").where("username", "=", "@"+username+"@"+domain).first()
                .then((accounts) => {
                    resolve("ok")
                    if(accounts){
                        // update
                    }else{
                        // create getWebfinger
                    }
                })
                .catch((e) => {
                    reject("Some internal error", e)
                })
            })
            .catch((e) => {
                console.error("ERROR in fetching getStreamFromUserBase")
            })
        })
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

module.exports = { addAccount }