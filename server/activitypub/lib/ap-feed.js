const axios = require('axios');

async function getWebfinger(address){
    const parts = address.split("@");
    const url = "https://"+parts[1]+"/.well-known/webfinger/?resource=acct:"+address;
    console.log("Webfinger lookup:", url)
    return new Promise((resolve, reject) => {
        axios
            .get(url)
            .then(res => {
                if(res.status==200){
                    resolve(res.data);
                }else{
                    reject("Not resolved (statuscode: "+res.status+")")
                }
            })
            .catch(error => {
                reject("Error in axios"+error)
            });
    });
}

function readLinkFromWebfinger(webfinger, rel){
    return new Promise((resolve, reject) => {
        for(let link of webfinger.links){
            if(link.rel==rel){
                resolve(link);
            }
        }
        reject("Could not find "+link+" in webfinger")
    })
}

async function getObjectItem(url, headers){
    if(url && url != "https://www.w3.org/ns/activitystreams#Public"){
        console.log("RUnning getObjectItem", url, headers)
        return new Promise((resolve, reject) => {
            axios({
                method: 'GET',
                headers,
                url
            })
                .then(res => {
                    if(res.status==200){
                        resolve(res.data);
                    }else{
                        reject("getObjectItem not resolved (statuscode: "+res.status+")")
                    }
                })
                .catch(error => {
                    reject("Error in axios"+error)
                });
        });
    }
}

module.exports = { getWebfinger, readLinkFromWebfinger, getObjectItem }