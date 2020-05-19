require("dotenv").config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const encrypt = require("mongoose-encryption");
const md5 = require('md5');
const app=express();
app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended: true}));
mongoose.connect("mongodb://localhost:27017/secretDB",{ useNewUrlParser: true , useUnifiedTopology: true });

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
  const user = new User({
    email: req.body.username,
    password: md5(req.body.password)
  });
  user.save();
  res.render("secrets");
});

app.post("/login",function(req,res){
  User.findOne({email: req.body.username},function(err,result){
  if(result){
    if(result.password=== md5(req.body.password)){
      res.render("secrets");
    }
    else{
      res.send("wrong password");
    }

    }
    else{
      res.send("no such username exists");
    }
  });
});




app.listen(3000,function(){
  console.log(" hello server started at port 3000");
});
