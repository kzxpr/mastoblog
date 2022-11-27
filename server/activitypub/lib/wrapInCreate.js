const db = require("./../../../knexfile")
const knex = require("knex")(db)
crypto = require('crypto');

function wrapInCreate(obj, username, domain, follower, guid = ""){
  var guidCreate;
  if(guid==""){
    guidCreate = crypto.randomBytes(16).toString('hex');
  }else{
    guidCreate = guid;
  }
    
    let createMessage = {
      '@context': 'https://www.w3.org/ns/activitystreams',
  
      'id': `https://${domain}/m/${guidCreate}`,
      'type': 'Create',
      'actor': `https://${domain}/u/${username}`,
      'to': ['https://www.w3.org/ns/activitystreams#Public'],
      'cc': [follower],
  
      'object': obj
    };
    
    return createMessage;
}

module.exports = { wrapInCreate }