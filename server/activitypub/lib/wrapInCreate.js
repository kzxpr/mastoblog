const db = require("./../../../knexfile")
const knex = require("knex")(db)
crypto = require('crypto');

function wrapInCreate(obj, username, domain, follower, guid = ""){
  var guidCreate;
  if(obj.id){
    //const cryptkey = crypto.randomBytes(16).toString('hex');;
    guidCreate = obj.id + "/create"
  }else{
    guidCreate = guid;
  }
  const dd = new Date();
  
  /* THIS FUNCTION SHOULD ALSO HANDLE "signatures" */
    
    let createMessage = {
      '@context': ['https://www.w3.org/ns/activitystreams'],
      'id': guidCreate,
      'type': 'Create',
      'actor': obj.attributedTo,
      'published': obj.published,
      'to': obj.to,
      'cc': obj.follower,
      'object': obj
    };
    
    return createMessage;
}

function wrapInUpdate(object, actor, domain = "", follower = [], guid = ""){
  //  actor | object | target | result | origin | instrument 
  /*var guidCreate;
  if(obj.id){
    //const cryptkey = crypto.randomBytes(16).toString('hex');;
    guidCreate = obj.id + "/create"
  }else{
    guidCreate = guid;
  }
  const dd = new Date();*/
  
  /* THIS FUNCTION SHOULD ALSO HANDLE "signatures" */
    
    let updateMessage = {
      '@context': ['https://www.w3.org/ns/activitystreams'],
      'type': 'Update',
      'actor': actor,
      'object': object
    };
    
    return updateMessage;
}

module.exports = { wrapInCreate, wrapInUpdate }