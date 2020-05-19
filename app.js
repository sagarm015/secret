require("dotenv").config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const encrypt = require("mongoose-encryption");
const md5 = require('md5');
const bcrypt = require("bcrypt");
const app=express();
app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended: true}));
mongoose.connect("mongodb://localhost:27017/secretDB",{ useNewUrlParser: true , useUnifiedTopology: true });
const saltRounds = 5;
const userSchema =new mongoose.Schema({
  email: String,
  password: String
});

//userSchema.plugin(encrypt,{secret: process.env.SECRET,encryptedFields: ["password"]}); level 2 secuirty
const User= mongoose.model("User",userSchema);

// REVIEW: gets request for the site
app.get("/",function(req,res){
  res.render("home");
});

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/register",function(req,res){
  res.render("register");
});



// REVIEW: posts requests

app.post("/register",function(req,res){
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    const user = new User({
      email: req.body.username,
      password: hash
    });
    user.save();
});


  res.render("secrets");
});

app.post("/login",function(req,res){
  User.findOne({email: req.body.username},function(err,result){
  if(result){
    bcrypt.compare(req.body.password,result.password, function(err, results) {
      if(results===true){
        res.render("secrets");
      }
  });

    }
    else{
      res.send("no such username exists");
    }
  });
});




app.listen(3000,function(){
  console.log(" hello server started at port 3000");
});
