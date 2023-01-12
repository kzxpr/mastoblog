const db = require("./../../../knexfile")
const knex = require("knex")(db)
const crypto = require('crypto');
const { getWebfinger, getObjectItem, readLinkFromWebfinger } = require("./ap-feed")

const emoji = require('node-emoji')

async function addProfileObjToAccounts(account_uri, profile){
    return new Promise(async(resolve, reject) => {
        if(account_uri && account_uri != "https://www.w3.org/ns/activitystreams#Public"){
            //console.log("PROF", profile, account_uri)
            const parsedProfile = parseProfile(profile);
            //console.log("PARSED", parsedProfile)
            await knex("apaccounts")
                .insert({
                    uri: account_uri,
                    ... parsedProfile,
                    createdAt: knex.fn.now()
                })
                .onConflict("uri").ignore()
                .then(async(ids) => {
                    //console.log("IDS", ids)
                    await knex("apaccounts")
                        .where("id", "=", ids[0])
                        .first()
                        .then((result) => {
                            //console.log("OK", result)
                            resolve(result)
                        })
                        .catch((err) => {
                            console.error("Error fetching ID", err)
                            reject("Knex error fetching ID "+ids[0])
                        })
                    
                })
                .catch((err) => {
                    console.error("Error while inserting to apaccounts", err)
                    reject(err);
                })
        }else{
            console.warn("No or invalid account_uri provided")
            reject("No or invalid account_uri provided")
        }
    })
}

async function lookupProfileObjByWebfinger(username){
    return new Promise(async(resolve, reject) => {
        const webfinger = await getWebfinger(username)
        const self_link = await readLinkFromWebfinger(webfinger, "self")
        const profileObj = await getObjectItem(self_link.href, { Accept: 'application/activity+json' })
        resolve(profileObj)
    })
}

function parseProfile(profile){
    const privkey = null;
    const apikey = null;
    const profile_link = profile.url
        ? profile.url
        : null;
    const username = profile.preferredUsername;
    const uri = profile.id;
    const server = uri.replace("https://", "").split("/")[0];
    const handle = username + "@" + server;
    const pubkey = profile.publicKey && profile.publicKey.publicKeyPem
        ? profile.publicKey.publicKeyPem
        : "";
    const inbox_uri = profile.inbox;
    const outbox_uri = profile.outbox;
    const followers_uri = profile.followers;
    const following_uri = profile.following;
    const featured_uri = profile.featured;
    const tags_uri = profile.featuredTags;
    var displayname = encodeStr(profile.preferredUsername);
    if(profile.name){
        displayname = encodeStr(profile.name);
    }
    const summary = profile.summary
        ? (profile.summary)
        : null;
    const icon = profile.icon && profile.icon.url
        ? profile.icon.url
        : null;
    const image = profile.image && profile.image.url
        ? profile.image.url
        : null;
    
    return {
        username, privkey, apikey, profile_link, pubkey, displayname, summary, icon, image, handle,
        inbox_uri, outbox_uri, followers_uri, following_uri, featured_uri, tags_uri
    }
}

async function lookupAccountByURI(account_uri){
    return new Promise(async(resolve, reject) => {
        //console.log("I'm looking up URI", account_uri)
        const user = await knex("apaccounts").where("uri", "=", account_uri)
        .then(async(accounts) => {
            //console.log("I found", accounts)
            if(accounts.length==1){
                // ok
                resolve(accounts[0])
            }else if(accounts.length==0){
                // lookup
                console.log("Zero accounts!")
                await getObjectItem(account_uri, { Accept: 'application/activity+json' })
                .then(async(profile) => {
                    await addProfileObjToAccounts(account_uri, profile)
                        .then((account) => {
                            //console.log("Here is account", account)
                            resolve(account);
                        })
                        .catch((err) => {
                            console.error(err)
                            reject(err)
                        })
                })
                .catch((err) => {
                    console.error(err)
                    reject(err)
                })
                        
            }else{
                reject("More than one account on URI: "+profile)
            }
        })
        .catch((err) => {
            console.error(err)
            reject(err)
        })
    })
}

async function findProfileItem(uri, db_field, profile_field){
    return new Promise(async(resolve, reject) => {
        if(uri){
            await knex("apaccounts").where("uri", "=", uri)
            .then(async(accounts) => {
                if(accounts.length==1){
                    if(accounts[0][db_field] != "" && accounts[0][db_field]!==null){
                        resolve(accounts[0][db_field])
                    }else{
                        console.log("No "+db_field+" on user "+uri)
                        await getObjectItem(uri, { Accept: 'application/activity+json' })
                            .then(async(profile) => {
                                if(profile[profile_field]){
                                    const uri_value = profile[profile_field];
                                    await knex("apaccounts").update(db_field, uri_value).where("uri", "=", uri)
                                    .then((data) => {
                                        resolve(uri_value);
                                    })
                                    .catch((e) => {
                                        console.error("ERROR in findProfileItem: Adding "+profile_field+" "+uri_value+" to "+uri)
                                        reject("ERROR in findProfileItem adding "+profile_field+" to user")
                                    })
                                }else{
                                    console.error("No "+profile_field+" on profile for user "+uri)
                                    reject("No "+profile_field+" on profile for user "+uri)
                                }
                            })
                            .catch((e) => {
                                reject("Unable to fetch user "+uri)
                            })
                    }
                }else if(accounts.length==0){
                    // lookup profile by URI
                    console.log("Zero accounts!")
                    await getObjectItem(uri, { Accept: 'application/activity+json' })
                    .then(async(profile) => {
                        await addProfileObjToAccounts(uri, profile)
                            .then((account) => {
                                //console.log("Here is account", account)
                                resolve(account[db_field]);
                            })
                            .catch((err) => {
                                console.error(err)
                                reject(err)
                            })
                    })
                    .catch((err) => {
                        console.error(err)
                        reject(err)
                    })
                }
            })
            .catch((e) => {
                console.error("findProfileItem ERROR:",e)
                reject("Error in findProfileItem")
            })
        }
    });
}

async function findOutbox(uri){
    return new Promise(async(resolve, reject) => {
        await findProfileItem(uri, "outbox_uri", "outbox")
        .then((data) => {
            console.log("PERFECT RESOLVE", data)
            resolve(data)
        })
        .catch((e) => {
            console.error("WRONG RESOLVE", e)
            reject("ERROR in findOutbox", e)
        })
    })
}

async function findFollowers(uri){
    return new Promise(async(resolve, reject) => {
        await findProfileItem(uri, "followers_uri", "followers")
        .then((data) => {
            resolve(data)
        })
        .catch((e) => {
            reject("ERROR in findFollowers", e)
        })
    })
}

async function findInbox(uri){
    return new Promise(async(resolve, reject) => {
        await findProfileItem(uri, "inbox_uri", "inbox")
        .then((data) => {
            resolve(data)
        })
        .catch((e) => {
            reject("ERROR in findInbox", e)
        })
    })
}

function encodeStr(rawStr){
    /*var encodedStr = rawStr.replace(/[\u00A0-\u9999<>\&]/g, function(i) {
        //return '&#'+i.charCodeAt(0)+';';
        return '&#'+i.codePointAt(0)+';';
    });*/
    const encodedStr = emoji.unemojify(rawStr)
    //const encodedStr = punycode.toUnicode(rawStr);
    return encodedStr;
}

module.exports = { encodeStr, addProfileObjToAccounts, lookupProfileObjByWebfinger, parseProfile, lookupAccountByURI, findInbox, findOutbox, findFollowers }