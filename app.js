require("dotenv").config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const ejs = require('ejs');
//const encrypt = require("mongoose-encryption");
//const md5 = require('md5');
//const bcrypt = require("bcrypt");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy; //
const FacebookStrategy = require("passport-facebook").Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(session({ //settin up are session
  secret: 'tujhe kaise batao',
  resave: false,
  saveUninitialized: true,
  //   cookie: { secure: true }
}));
app.use(passport.initialize()); //use pass port and intialize
app.use(passport.session()); //setting up passport for authentication in the session


mongoose.connect("mongodb://localhost:27017/secretDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set('useCreateIndex', true); // handle warning
//const saltRounds = 5;
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  facebookId: String
});

userSchema.plugin(passportLocalMongoose); //hash salt password and mongodb storage
userSchema.plugin(findOrCreate);

//userSchema.plugin(encrypt,{secret: process.env.SECRET,encryptedFields: ["password"]}); level 2 secuirty
const User = mongoose.model("User", userSchema);
passport.use(User.createStrategy()); //helps create strategy

// passport.serializeUser(User.serializeUser());        //create cookie and stuffs info
// passport.deserializeUser(User.deserializeUser());   //break cookie and use info
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// window.fbAsyncInit = function() {
//   FB.init({
//     appId      : '{your-app-id}',
//     cookie     : true,
//     xfbml      : true,
//     version    : '{api-version}'
//   });
//
//   FB.AppEvents.logPageView();
//
// };
//
// (function(d, s, id){
//    var js, fjs = d.getElementsByTagName(s)[0];
//    if (d.getElementById(id)) {return;}
//    js = d.createElement(s); js.id = id;
//    js.src = "https://connect.facebook.net/en_US/sdk.js";
//    fjs.parentNode.insertBefore(js, fjs);
//  }(document, 'script', 'facebook-jssdk'));
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({
      facebookId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new GoogleStrategy({ //
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"

  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));
// REVIEW: gets request for the site
app.get("/", function(req, res) {
  res.render("home");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});
app.get("/auth/google", //
  passport.authenticate("google", {
    scope: ["profile"]
  })
);

app.get('/auth/google/secrets',
  passport.authenticate('google', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });
app.get('/auth/facebook',
  passport.authenticate('facebook')
);

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });


// REVIEW: posts requests

// app.post("/register",function(req,res){
//   bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
//     const user = new User({
//       email: req.body.username,
//       password: hash
//     });
//     user.save();
// });
//
//
//   res.render("secrets");
// });
//
// app.post("/login",function(req,res){
//   User.findOne({email: req.body.username},function(err,result){
//   if(result){
//     bcrypt.compare(req.body.password,result.password, function(err, results) {
//       if(results===true){
//         res.render("secrets");
//       }
//   });
//
//     }
//     else{
//       res.send("no such username exists");
//     }
//   });
// });
//
app.get("/secrets", function(req, res) {
  if (req.isAuthenticated()) { //checking if the request is authenticated or not - hence if the logged in session is not set up either thru login ot register command we will not render secrets
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});
app.get("/logout", function(req, res) {
  req.logout(); //end session
  res.redirect("/");
});

app.post("/register", function(req, res) {
  User.register({
    username: req.body.username
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() { //Req is for requesting the cookies saved on client's browser res is for setting cookies to the client's browser
        res.redirect("/secrets"); //making our user authenticated and setting logged in session for them
      }); //logged in session has great importance in this concept
    }
  });
});
app.post("/login", function(req, res) {
  const user = new User({ //recieving info
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err) { //checking if the credentials to login are correct or not if correct then got to else
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function() { //hence if we land up here it means user is goood boy
        res.redirect("/secrets"); //we will not set up and authenticated loggin session for him..happy using
      });
    }
  });
});

app.listen(3000, function() {
  console.log(" hello server started at port 3000");
});
