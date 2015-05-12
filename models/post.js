
// user.js
let mongoose = require('mongoose')


require ('songbird')

let commentSchema = mongoose.Schema({
    content: {
        type: String,
        required: true
    }, 
    createDate: {
        type: Date,
        default: Date.now
    },
    username: String
})

let postSchema = mongoose.Schema({
    title: {
    	type: String,
      required: true
    },
    content: {
    	type: String,
      required: true
    },
   	image: {
      data: Buffer,
      contentType: String
    },

    createDate: {
      type: String,
      default: Date.now
    },
    modifiedDate: {
      type: String,
      default: Date.now
    },
    count: {
      type: String,
      // required: true
    },
    userId: mongoose.Schema.ObjectId,
    comments: [commentSchema],
})



postSchema.pre('save', function(next) {
    this.updated = Date.now()
    next()
})

module.exports = mongoose.model('Post', postSchema)