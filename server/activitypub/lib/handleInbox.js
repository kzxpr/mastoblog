async function handleInbox(domain, req){
    const aplog = await startAPLog(req)
    // pass in a name for an account, if the account doesn't exist, create it!
    
    const myURL = new URL(req.body.actor);
    let targetDomain = myURL.hostname;
    //console.log("INBOX",targetDomain)
    // TODO: add "Undo" follow event
    
    const reqtype = req.body.type;
    //console.log("Reqtype",reqtype)

    console.log("ACTOR", req.body.actor)
    const sender = await knex("apaccounts").where("uri", "=", req.body.actor)
        .then((rows) => {
            if(rows.length==1){
                return rows[0]
            }else{
                return {};
                console.warn("Ingen ACTOR in apaccounts...")
            }
        })
    
    if(reqtype === 'Create'){
        const objtype = req.body.object.type;
        if(objtype==="Note"){
            console.log("I created a note saying",req.body.object.content)
            addMessage(req.body.object)
            /*if(sender){
                const objwithoutsignature = Object.keys(req.body)
                    .filter(key => key !== 'signature')
                    .reduce((obj, key) => {
                        obj[key] = req.body[key];
                        return obj;
                    }, {}
                );
                
                const test = JSON.stringify(req.body) + req.body.signature.nonce;
                const checkSignature = await verifySignature(test, sender.pubkey, req.body.signature.signatureValue)
                console.log("VERIFY SIGNATURE", checkSignature)
            }*/
            await endAPLog(aplog, "Received note", 201)
            res.sendStatus(201)
        }else if(objtype==="Article"){
            console.log("I got a article saying",req.body.object.content)
            addMessage(req.body.object)
            await endAPLog(aplog, "Received article", 201)
            res.sendStatus(201)
        }else{
            await endAPLog(aplog, "Received create, but object type wasn't recognized", 500)
            console.warn("RECEIVED", objtype)
            res.sendStatus(500)
        }
    }else if(reqtype == 'Follow'){
        if(typeof req.body.object === 'string'){
            //let local_username = req.body.object.replace("https://"+domain+"/u/", "");
            const local_uri = req.body.object;
            await knex("apaccounts").where("uri", "=", local_uri).first()
            .then(async(account) => {
                if(account){
                    const follower_uri = req.body.actor;
                    console.log("TEST", follower_uri);
                    await lookupAccountByURI(follower_uri)
                        .then(async(follower_account) => {
                            // jubii!

                            await addFollower(local_uri, follower_uri)
                            await sendAcceptMessage(req.body, local_uri, targetDomain)
                            await sendLatestMessages(follower_uri, local_uri)
                            .then(async(d) => {
                                await endAPLog(aplog, "Pinned messages were sent to new follower: "+follower_uri)
                                res.sendStatus(200)
                            })
                            .catch(async(e) => {
                                console.error("ERROR in sendLatestMessages", e)
                                await endAPLog(aplog, "ERROR in sendLatestMessages", 500)
                                res.sendStatus(500)
                            })
                        })
                        .catch((err) => {
                            console.error(err)
                            console.error("ERROR doing lookupAccountByURI", follower_uri)
                            res.sendStatus(500)
                        })
                    //console.log("FOLLOW MED",req.body, local_username, domain, targetDomain)
                    
                }else{
                    res.sendStatus(404)
                }
            });
        }else{
            console.error("I got a follow request I can't handle because object is not a string!", req.body.object)
            res.sendStatus(500)
        }
    }else{
        await endAPLog(aplog, "REQ type is not recognized...", 500)
        res.sendStatus(500)
    }
}