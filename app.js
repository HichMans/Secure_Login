//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require('express-session');
const passport =require('passport');
const passportLocalMongoose=require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy= require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const app = express();


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: 'this will be removed to .env.',
  resave: false,
  saveUninitialized: true,
  //cookie: { secure: true }
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set("useCreateIndex",true);
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  facebookId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("user", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
//--google authetication Strategy--//
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
  //  console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//--Facebook authetication strategy--//
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("home");
});

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });


app.get("/auth/google",
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.route("/login")
  .get((req, res) => {
    res.render("login");
  })
  .post((req, res) => {

 const user = new User ({
   username:req.body.username,
   password:req.body.password
 });
 req.login(user,(err)=> {
   if (err) {console.log(" Post login :"+err);}
   else {
     passport.authenticate("local") (req,res, function (){
    res.redirect("/secrets");
      } );
   }
 });

  });

app.route("/register")

  .get((req, res) => {
    res.render("register");
  })
  .post((req, res) => {

    User.register({username:req.body.username},req.body.password,function(err, user) {
      if(err) {console.log(err);}
       else {
         passport.authenticate("local") (req,res, function (){
        res.redirect("/secrets");
          } );
      }

    });


  });

app.route("/secrets").get((req,res)=>{
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }

});
app.route("/logout")
.get( (req,res) =>{
  req.logout();
  res.redirect("/");
});



app.listen(3000, function() {
  console.log("Server started on port 3000");
});
