function createWebfinger(name, domain) {
    return {
      'subject': `acct:${name}@${domain}`,
  
      'links': [
        {
          'rel': 'self',
          'type': 'application/activity+json',
          'href': `https://${domain}/u/${name}`
        }
      ]
    };
  }

module.exports = createWebfinger;