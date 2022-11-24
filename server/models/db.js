const { Model } = require("objection")
const db = require("../../knexfile")

const knex = require('knex')(db)

Model.knex(knex)

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

module.exports = { Post, Tag }