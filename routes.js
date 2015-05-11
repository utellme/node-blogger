
let fs = require('fs')
let multiparty = require('multiparty')
let then = require('express-then')
let isLoggedIn = require('./middleware/isLoggedIn')
let passport = require('passport')
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

	app.get('/profile', isLoggedIn, (req, res) => res.render('profile.ejs', {

		// email: req.user.email,
		// id: req.user.id,
		// password: req.user.password
		user: req.user,
		message: req.flash('error')
	}))

	app.get('/logout', (req, res) =>{
		// console.log("******1");
	  req.logout();
	  res.redirect('/');
	 
	})

	app.get('/post/:postId?', then( async (req, res) =>{
	
		 let postId = req.params.postId
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
		res.render('post.ejs', {
			post: post,
			verb: 'Edit',
			image: 'data:${post.image.contentType};base64,${image.base64}'
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
	 	await post.save()

	 	//console.log("****** Blog Title " + req.user.blogTitle)
	 	
	 	// res.redirect('/blog/' + encodeURI(req.user.blogTitle))
	 	res.redirect('/blog/' + "some data")

	 	return

	 }
	 let post = await Post.promise.findById(postId)
	 if(!post) res.send(404, 'Not found')

	 let [{title: [title], content: [content]},{image: [file]}] = await new multiparty.Form().promise.parse(req)
	 post.image.data = await fs.promise.readFile(file.path)
	 post.image.contentType = file.headers['content-type']

	 post.title = title
	 post.content = content
	 await post.save()
	// res.redirect('/blog/' + encodeURI(req.user.blogTitle))
	 res.redirect('/blog/' + "some data")

	 
	}))
}
