// Video.js
// The set of videos registered in our app.

module.exports = {
	autoPK: false,
	attributes: {
		id :{
			type: 'integer',
			autoIncrement: true,
			primaryKey: true,
			columnName: 'video_id'
		},

		title: {
			type: 'string',
			required: true
		},

		description: {
			type: 'string'
		},

		// naive method
		// can be improve by doing many-to-many association
		tags: {
			type: 'array'
		},

		ownedBy: {
			model: 'user',
		},

		// 0 for self only, 1 for public
		privacy: {
			type: 'integer',
			defaultsTo: 1
		},

		embedURL: {
			type: 'string'
		},

		mpdDir: {
			type: 'array'
		},

		mp3Dir: {
			type: 'string'
		},

		thumbnailDir: {
			type: 'string'
		},

		hasProcessed: {
			type: 'string',
			enum: ['false', 'true'],
			defaultsTo: 'false'
		},

		createdAt: {
			type: 'datetime',
			defaultsTo: function() {return new Date(); }
		},

		updatedAt: {
			type: 'datetime',
			defaultsTo: function() {return new Date(); }
		},

		// Add a reference to ViewSession
		viewedSessions: {
			collection: 'ViewSession',
			via: 'videoId'
		}
	}
}
