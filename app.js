//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require('express-session');
const passport =require('passport');
const passportLocalMongoose=require('passport-local-mongoose');

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
  password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("user", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("home");
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
