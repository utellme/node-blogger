
let fs = require('fs')
let multiparty = require('multiparty')
let then = require('express-then')
let isLoggedIn = require('./middleware/isLoggedIn')
let passport = require('./middleware/passport')
let Post = require('./models/post')
let DataUri = require('datauri')

module.exports = (app) => {

	let passport = app.passport

	app.get('/', (req, res)=> res.render('index.ejs'))

	app.get('/login', (req, res)=> res.render('login.ejs', {message: req.flash('error')}))

	app.post('/login', passport.authenticate('local', {

		successRedirect: '/profile',
		failureRedirect: '/login',
		failureFlash: true

	}))

	app.get('/signup', (req, res)=> res.render('signup.ejs', {message: req.flash('error')}))

	// process the signup form
	app.post('/signup', passport.authenticate('local-signup', {

		// {}=> {console.log('******passport-authentication')}

	    successRedirect: '/profile',
	    failureRedirect: '/signup',
	    failureFlash: true
	}))

	// function isLoggedIn(req, res, next) {
	//     if (req.isAuthenticated()) return next()
	//      res.redirect('/')
	// }

	// app.get('/profile', isLoggedIn, (req, res) => res.render('profile.ejs', {

	// 	// email: req.user.email,
	// 	// id: req.user.id,
	// 	// password: req.user.password
	// 	user: req.user,

	// 	message: req.flash('error')
	// }))

	app.get('/profile', isLoggedIn, then(async(req, res) => {
        let posts = await Post.promise.find({
            userId: req.user.id
        })

        console.log("*******userId:" + req.user.id)
        console.log("*******posts:" + JSON.stringify(posts))

        let comments = []
        for (let post of posts) {

        	    console.log("***** Post.createDate:" + post.createDate)
            	console.log("***** Post.modifiedDate:" + post.modifiedDate)
            	console.log("***** Post.title:" + post.title)
            if (post.comments && post.comments.length > 0) {

            	// console.log("***** Comment.username:" + comment.username)
            	// console.log("***** Comment.createDate:" + comment.createDate)
            	// console.log("***** Post.comments:" + post.comment)
            	// console.log("***** Post.createDate:" + post.createDate)
            	// console.log("***** Post.modifiedDate:" + post.modifiedDate)
            	// console.log("***** Post.title:" + post.title)
                // take the last comment in the array as the latest comment
                let comment = post.comments[post.comments.length - 1]

                comments.push({
                    content: comment.content.substr(0, 124),
                    username: comment.username,
                    created: comment.createDate,
                    postLink: "/post/" + post.id
                })
            }
        }
        res.render('profile.ejs', {
            user: req.user,
            posts: posts,
            comments: comments,
            message: req.flash('error'),

        })
    }))

	app.get('/logout', (req, res) =>{
		// console.log("******1");
	  req.logout();
	  res.redirect('/');
	 
	})

	app.get('/post/:postId?', then( async (req, res) =>{
	
		 let postId = req.params.postId
		 let reqUserId = req.user ? req.user.id : null
		 if(!postId) {

		 		res.render('post.ejs', {
				post:{},
			 	verb: 'Create'
		 	})
		 	return
		 }

		let post = await Post.promise.findById(postId)
		if(!post) res.send(404, 'Not found')

		let dataUri = new DataUri
		let image = dataUri.format('.' + post.image.contentType.split('/').pop(), post.image.data)

		//console.log(image)
		res.render('blogger.ejs', {
			post: post,
			verb: 'Edit',
			// image: 'data:${post.image.contentType};base64,${image.base64}'
			image: `data:${post.image.contentType};base64,${image.base64}`,
			requestUserId: reqUserId,
			canEdit: reqUserId && (reqUserId == post.userId)
		})

	}))

	app.post('/post/:postId?', then( async (req, res) =>{
	
	 let postId = req.params.postId
	 if(!postId){

	 	let post = new Post()

	 	let [{title: [title], content: [content]},{image: [file]}] = await new multiparty.Form().promise.parse(req)

	 	
	 	// console.log("****** Body Title " + req.body.title)
	 	
	 	post.title = title
	 	post.content = content

	 	post.image.data = await fs.promise.readFile(file.path)
	 	post.image.contentType = file.headers['content-type']
	 	post.userId = req.user.id
	 	
	 	await post.save()

	 	//console.log("****** Blog Title " + req.user.blogTitle)
	 	
	 	// res.redirect('/blog/' + encodeURI(req.user.blogTitle))
	 	//res.redirect('/blog/' + "some data")
	 	postId = post.id
        res.redirect('/post/' + postId)

	 	return

	 }
	 let post = await Post.promise.findById(postId)
	 if(!post) res.send(404, 'Not found')

	 let [{title: [title], content: [content]},{image: [file]}] = await new multiparty.Form().promise.parse(req)
	 post.image.data = await fs.promise.readFile(file.path)
	 post.image.contentType = file.headers['content-type']

	 post.title = title
	 post.content = content
	 post.userId = req.user.id
	 await post.save()
	// res.redirect('/blog/' + encodeURI(req.user.blogTitle))
	 //res.redirect('/blog/' + "some data")
	 postId = post.id
     res.redirect('/post/' + postId)

	 
	}))

	app.post('/comment', isLoggedIn, then(async(req, res) => {

        let post = await Post.promise.findById(req.body.postId)
        if (post) {
            post.comments.push({
                content: req.body.comment,
                username: req.user.username
            })
            await post.save()
        }

        res.redirect('/post/' + req.body.postId)
    }))

    app.get('/post/edit/:postId?', then(async(req, res) => {
        let postId = req.params.postId
        let requestUserId = req.user ? req.user.id : null
        if (!postId) {
            res.render('edit.ejs', {
                post: {
                    comments: []
                },
                verb: 'Create'
            })
            return
        }
        let post = await Post.promise.findById(postId)
        if (!post) res.status(404).send('Not found')

        let dataUri = new DataUri()
        let image
        let imageData
        if (post.image.data) {
            image = dataUri.format('.' + post.image.contentType.split('/').pop(), post.image.data)
            imageData = `data:${post.image.contentType};base64,${image.base64}`
        }
        return res.render('edit.ejs', {
            post: post,
            verb: 'Edit',
            image: imageData,
            requestUserId: requestUserId
        })
    }))

    app.post('/logincomment', passport.authenticate('local-login'), then(async(req, res) => {

        // get the post document
        let post = await Post.promise.findById(req.body.postId)
        if (post) {
            post.comments.push({
                content: req.body.comment,
                username: req.user.username
            })
            await post.save()
        }

        res.redirect('/post/' + req.body.postId)
    }))

    app.delete('/post/:postId', isLoggedIn, (req, res) => {
        async() => {
            let postId = req.params.postId
            let post = await Post.promise.findById(postId)
            if (post) await post.promise.remove()
            res.end()
        }().catch(e => console.log('err', e))
    })

    //get all posts
    app.get('/posts', then(async(req, res) => {
        let posts = await Post.promise.find({})
        let requestUserId = req.user ? req.user.id : null
        let dataUri = new DataUri()
        for (var post of posts) {
            if (post.image.data) {
                let image = dataUri.format('.' + post.image.contentType.split('/').pop(), post.image.data)
                post.imageData = `data:${post.image.contentType};base64,${image.base64}`
            }
        }
        res.render('allposts.ejs', {
            posts: posts,
            requestUserId: requestUserId,
            blogUserId: null
        })
    }))
}
