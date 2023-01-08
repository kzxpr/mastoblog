function createWebfinger(username, domain) {
    return {
      'subject': `acct:${username}@${domain}`,
  
      'links': [
        {
          'rel': 'self',
          'type': 'application/activity+json',
          'href': `https://${domain}/u/${username}`
        }
      ]
    };
  }

module.exports = createWebfinger;