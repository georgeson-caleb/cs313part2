var express = require('express');
var app = express();
var pg = require('pg');
var path = require("path");
var bodyParser = require('body-parser');
var session = require("express-session");
var bcrypt = require("bcrypt");
const request = require('request');
const https = require('https');
const { check, validationResult } = require("express-validator");
require('dotenv').config();
var connectionString = process.env.DATABASE_URL;
var secretToken = process.env.SECRET_TOKEN;
var ssn;
const PORT = process.env.PORT || 5000;

var pool = new pg.Pool({connectionString: connectionString});

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: false}));
app.use(session({secret: secretToken, resave: true, saveUninitialized: false}));

// GET requests
app.get('/', renderLogin);
app.get('/home', renderHome);
app.get('/searchStocks', searchStocks);
app.get('/purchase', purchase);
app.get('/sell', sell);

// POST requests
app.post("/createAccount", [check('email').isEmail().normalizeEmail()], createAccount);
app.post("/login", [check('email').isEmail().normalizeEmail()], requestLogin);


app.listen(PORT);

function renderLogin(req, res) {
   ssn = req.session;
   res.render('pages/login');
}

function renderHome(req, res) {
   ssn = req.session;

   console.log("User id: " + ssn.user_id);

   pool.query("SELECT money FROM users WHERE id=$1", [ssn.user_id], function(err, result) {
      if (err) {
         console.error("Error running query. ", err);
      } else {
         ssn.money = result.rows[0].money;
         res.render('pages/home', {
            userId: ssn.user_id,
            money: ssn.money
         });
      }
   });
}

function createAccount(req, res, next) {
   ssn = req.session;
   var email = req.body.email;

   // Hash password
   bcrypt.hash(req.body.password, 1, function(err, encrypted) {
      if (err) {

      } else {
   // Check if the email is valid
         var query = "SELECT id FROM users WHERE email = $1";
         var valid = pool.query(query, [email], function(err, result) {
            if (err) {
               console.error("Error running query. ", err);
            } else {
               if (result.rows.length == 0) {
   // If email is valid, create account
                  var query = "INSERT INTO users (email, password, money) VALUES ($1, $2, 1000) returning id";
                  pool.query(query, [email, encrypted], function(err, result) {
                     if (err) {
                        console.error("Error running query. ", err);
                     }
                     ssn.user_id = result.rows[0].id;
                     res.send("" + result.rows[0].id);
                     res.end();
                  });
               } else {
   // If email is not valid, send response to page
                  res.send("invalid");
                  res.end();
               }
            }
         });
      }
   });
   
}

function requestLogin(req, res) {
   ssn = req.session;

   var email = req.body.email;
   var password = req.body.password;

   pool.query("SELECT id, password FROM users WHERE email = $1", [email], function(err, result) {

      if (err) {
         console.log("Error running query. ", err);
      } else {

         // Check if password is valid

         console.log(JSON.stringify(result.rows[0].password))
         var hash = result.rows[0].password;
         
        /*
 bcrypt.compare(password, hash, function(err, same) {
            if (err) {
               console.error("Error comparing passwords. ", err);
            } else {
               if (same) {
                  ssn.user_id = result.rows[0].id;
                  res.send("valid");
                  res.end();
               } else {
                  res.send("invalid");
                  res.end();
               }
            }
         });
        */
         
      }
   });
}

function searchStocks(req, res) {
   var url = "https://api.worldtradingdata.com/api/v1/stock?symbol=" + req.query.symbol + "&api_token=" + process.env.STOCK_API_KEY;

   https.get(
      url,
      (response) => {
         let todo = '';
         response.on('data', (chunk) => {
            todo += chunk;
         });

         response.on('end', () => {
            res.send(todo);
            res.end();
         })
      }
   ).on("error", (error) => {
      console.log("Error: " + error.message);
   });
}

function purchase(req, res) {
   ssn = req.session;

   var user_id = ssn.user_id;
}

function sell(req, res) {

}