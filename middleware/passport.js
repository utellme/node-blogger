let nodeifyit = require('nodeifyit')
let User = require('../models/User')
let LocalStrategy = require('passport-local').Strategy
// let passport = require('passport')
require('songbird')

module.exports = (app) => {

	let passport = app.passport

	

	passport.use(new LocalStrategy ({

	   	// console.log('******* new local-strategy 1')
		usernameField: 'username',

		failureFlash: true

		}, nodeifyit( async (username, password) => {

	       //email = (email || '').toLowerCase()

	       // if(email !== user.email) {
	       // 	return [false, {message: 'Invalid username'}]
	       // }
	
	       let user
	       if(username.indexOf('@') !== -1){

	       		let email = username.toLowerCase()
	       		user = await User.promise.findOne({email})

	   			// console.log("******user: " + JSON.stringify(user))
	       } else {

	       	 	let regexp = new RegExp(username, 'i')
	       	 	user = await User.promise.findOne({
	       	 		username: {$regex: regexp}
	       	 	})

	       }
	       

	       if (!user) {
	         return [false, {message: 'Invalid username.'}]
	    	}

	    	console.log("******user passed")
	       // if(!await bcrypt.promise.compare(password, user.password)) {
	       	if(!await user.validatePassword(password)){
	       	 return [false, {message: 'Invalid password'}]
	       	}

	       return user

		}, {spread: true} )))


	passport.serializeUser(nodeifyit(async (user) => user._id))

	passport.deserializeUser(nodeifyit(async(id) => {
		return await User.findById(id)
	}))

	passport.use('local-signup', new LocalStrategy({
	   // Use "email" field instead of "username"
	   // console.log('******* new local-strategy 2')
	   usernameField: 'email',
	   failureFlash: true,
	   passReqToCallback: true

	}, nodeifyit(async (req, email, password) => {
	    console.log('******* passport nodeifyit 2')
	    email = (email || '').toLowerCase()
	    // Is the email taken?
	    if (await User.promise.findOne({email})) {
	        return [false, {message: 'That email is already taken.'}]
	    }

	    // console.log('*******Req body:' + JSON.stringify(req.body))

	    let {username, title, description} = req.body

	    let regexp = new RegExp(username, 'i')

		let query = {username: {$regex: regexp}}

		// console.log('***************' + query)

		// let result =  await User.promise.findone('aaa')

		// console.log('************* Query result: ' + result )

	    if(await User.promise.findOne(query)){
	    	return [false, {message: 'That username is already taken.'}]
	    }


	    // create the user
	    let user = new User()
	    user.email = email
	    user.username = username
	    user.blogTitle = title
	    user.blogDescription = description
	    // Use a password hash instead of plain-text
	    //user.password = await user.generateHash(password)
	    user.password = password

	    try{

	     return await user.save()

	    } catch (e){

	     return [false, {message: e.message}]
	    }
	    
	}, {spread: true})))

}
