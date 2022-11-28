const db = require("./../../../knexfile")
const knex = require("knex")(db)
crypto = require('crypto');

function wrapInCreate(obj, username, domain, follower, guid = ""){
  var guidCreate;
  if(guid==""){
    const cryptkey = crypto.randomBytes(16).toString('hex');;
    guidCreate = `https://${domain}/m/${cryptkey}`
  }else{
    guidCreate = guid;
  }
  const dd = new Date();
  
    
    let createMessage = {
      '@context': ['https://www.w3.org/ns/activitystreams'],
      'id': guidCreate,
      'type': 'Create',
      'actor': `https://${domain}/u/${username}`,
      'published': dd.toISOString(),
      'to': ['https://www.w3.org/ns/activitystreams#Public'],
      'cc': [follower],
  
      'object': obj
    };
    
    return createMessage;
}

module.exports = { wrapInCreate }