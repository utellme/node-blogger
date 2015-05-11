let express = require('express')
let organ = require('morgan')
let bodyParser = require('body-parser')
let cookieParser = require('cookie-parser')
let session = require('express-session')
let passport = require('passport')
// let nodeifyit = require('nodeifyit')
// let bcrypt = require('bcrypt')
let flash = require('connect-flash')
let mongoose = require('mongoose')
// let User = require('./user.js')
let routes = require('./routes')
let passportMiddleware = require('./middleware/passport')

require('songbird')

const MODE_ENV = process.env.NODE_ENV
const PORT = process.env.PORT || 8000
// const SALT = bcrypt.genSaltSync(10)

let app = express()
app.passport = passport
//before app.listen
app.set('view engine', 'ejs')

// let user = {
// 	email: 'foo@foo.com',
// 	password: bcrypt.hashSync('asdf', SALT)
// }




app.use(express.static('public'))

// read cookies, required for sessions
app.use(cookieParser('ilovethenodejs'))

// get POST/PUT body information (e.g html forms like login)
app.use(bodyParser.json())

app.use(bodyParser.urlencoded({extended: true}))

app.use(session({

	secret: 'ilovethenodejs',
	resave: true,
	saveUniitialized: true
}))

app.use(passport.initialize())

app.use(passport.session())

app.use(flash())


passportMiddleware(app)

routes(app)

app.listen(PORT, ()=>console.log('Listening @http://127.0.0.1:' + PORT))

mongoose.connect('mongodb://127.0.0.1:27017/blogger')
// process the login form

//after app.listen

