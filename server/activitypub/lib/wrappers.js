const db = require("../../../knexfile")
const knex = require("knex")(db)
crypto = require('crypto');

function wrapInCreate(obj, actor, follower, guid = ""){
  // This wrap requires to or cc...
  var guidCreate;
  if(obj.id){
    //const cryptkey = crypto.randomBytes(16).toString('hex');
    guidCreate = obj.id + "/create"
  }else{
    guidCreate = guid;
  }
    
    let createMessage = {
      '@context': ['https://www.w3.org/ns/activitystreams'],
      'id': guidCreate,
      'type': 'Create',
      'actor': actor,
      'published': obj.published,
      'to': obj.to,
      'cc': obj.cc,
      'object': obj
    };
    
    return createMessage;
}

function wrapInUpdate(object, actor, domain = "", follower = [], guid = ""){
  //  actor | object | target | result | origin | instrument 
  
    const random = crypto.randomBytes(16).toString('hex');
    let updateMessage = {
      '@context': ['https://www.w3.org/ns/activitystreams'],
      'id': object.id+"/update/"+random,
      'type': 'Update',
      'actor': actor,
      'object': object
    };
    
    return updateMessage;
}

function wrapInDelete(object, actor, domain = "", params, guid = ""){
  // Doesn't require to or cc
  //const { to, cc } = params;
    
    let message = {
      '@context': ['https://www.w3.org/ns/activitystreams'],
      'id': actor+"/activity/"+guid+"/delete",
      'type': 'Delete',
      'actor': actor,
      'object': object
    };
    
    return message;
}

function wrapInAnnounce(object, actor, domain = "", params, guid = ""){
  // This wrap requires to or cc...
  const { to, cc } = params;
    
  let wrap = {}
  wrap["@context"] = ['https://www.w3.org/ns/activitystreams'];
  wrap['id'] = actor+"/activity/"+guid+"/announce",
  wrap["type"] = 'Announce';
  wrap["actor"] = actor;
  wrap["to"] = [ to ];
  if(cc){
    wrap["cc"] = [ cc ];
  }
  wrap["object"] = object

  return wrap;
}

function wrapInFollow(object, actor, domain = "", follower = [], guid = ""){
  // This wrap DOESN'T require to or cc...
    
    let message = {
      '@context': ['https://www.w3.org/ns/activitystreams'],
      'id': actor+"/activity/"+guid+"/follow",
      'type': 'Follow',
      'actor': actor,
      'object': object
    };
    
    return message;
}

function wrapInUndo(object, actor, domain = "", follower = [], guid = "", params){
  const { to, cc } = params;
    
    let message = {
      '@context': ['https://www.w3.org/ns/activitystreams'],
      'id': actor+"/activity/"+guid+"/undo",
      'type': 'Undo',
      'actor': actor,
      'to': to,
      'cc': cc,
      'object': object
    };
    
    return message;
}

function wrapInFlag(object, actor, domain = "", follower = [], guid = ""){
    let message = {
      '@context': ['https://www.w3.org/ns/activitystreams'],
      'type': 'Flag',
      'actor': actor,
      'object': object
    };
    
    return message;
}

function wrapInLike(object, actor, domain = "", follower = [], guid = ""){    
    let message = {
      '@context': ['https://www.w3.org/ns/activitystreams'],
      'guid': guid+"/like",
      'type': 'Like',
      'actor': actor,
      'object': object
    };
    
    return message;
}

module.exports = { wrapInCreate, wrapInUpdate, wrapInDelete, wrapInFlag, wrapInUndo, wrapInAnnounce, wrapInFollow, wrapInLike }