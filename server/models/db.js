const { Model } = require("objection")
const db = require("../../knexfile")

const knex = require('knex')(db)

Model.knex(knex)

class Account extends Model {
	static get tableName() {
		return 'apaccounts';
	}

	static get relationMappings() {
		return {
			followers: {
				relation: Model.ManyToManyRelation,
				modelClass: Account,
				join: {
					from: 'apaccounts.uri',
					through: {
						from: 'apfollowers.username',
						to: 'apfollowers.follower'
					},
					to: 'apaccounts.uri'
				}
			},
			following: {
				relation: Model.ManyToManyRelation,
				modelClass: Account,
				join: {
					from: 'apaccounts.uri',
					through: {
						from: 'apfollowers.follower',
						to: 'apfollowers.username'
					},
					to: 'apaccounts.uri'
				}
			}
		}
	}
}

class Message extends Model {
	static get tableName() {
		return 'apmessages';
	}

	static get relationMappings() {
		return {
			creator: {
				relation: Model.HasOneRelation,
				modelClass: Account,
				join: {
					from: 'apmessages.attributedTo',
					to: 'apaccounts.uri'
				}
			},
			addressees: {
				relation: Model.ManyToManyRelation,
				modelClass: Account,
				join: {
					from: 'apmessages.uri',
					through: {
						from: 'apaddressee.message_uri',
						to: 'apaddressee.account_uri',
						extra: { field: 'field', type: 'type' }
					},
					to: 'apaccounts.uri'
				}
			}
		}
	}
}

class Post extends Model {
	static get tableName() {
		return 'posts';
	}

	static get relationMappings() {
		return {
			tags: {
				relation: Model.ManyToManyRelation,
				modelClass: Tag,
				join: {
					from: 'posts.id',
					through: {
						from: 'postvstag.post_id',
						to: 'postvstag.tag_id'
					},
					to: 'tags.id'
				}
			}
		}
	}
}

class Tag extends Model {
	static get tableName() {
		return 'tags';
	}

	static get relationMappings() {
		return {
			posts: {
				relation: Model.ManyToManyRelation,
				modelClass: Post,
				join: {
					from: 'tags.id',
					through: {
						from: 'postvstag.tag_id',
						to: 'postvstag.post_id'
					},
					to: 'posts.id'
				}
			}
		}
	}
}

module.exports = { Post, Tag, Account, Message }