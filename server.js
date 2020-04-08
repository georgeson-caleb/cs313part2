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

const apiUrl = "https://cloud.iexapis.com/"
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
app.get('/home', loadHome);
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

function loadHome(req, res) {
   ssn = req.session;

   console.log("User id: " + ssn.user_id);

   pool.query("SELECT money FROM users WHERE id=$1", [ssn.user_id], function(err, result) {
      if (err) {
         console.error("Error running query. ", err);
      } else {
         ssn.money = result.rows[0].money;
         pool.query("SELECT symbol, money_invested, quantity FROM stocks WHERE user_id=$1", [ssn.user_id], function(err, result) {
            if (err) {
               console.error("Error running query. ", err);
            } else {
               ssn.stocks = result.rows;
               if (result.rows.length == 0) {
                  renderHome(req, res);
               } else {
                  getCurrentPrice(req, res, 0, getCurrentPrice)
               }
            }
         });

         
      }
   });
}

function getCurrentPrice(req, res, index, callback) {
   ssn = req.session;

   console.log(ssn.stocks[index].symbol);

   var url = apiUrl + "stable/tops?symbols=" + ssn.stocks[index].symbol + "&token=" + process.env.STOCK_API_KEY;
   https.get(
      url,
      (response) => {
         let todo = '';
         response.on('data', (chunk) => {
            todo += chunk;
         });

         response.on('end', () => {
            var obj = JSON.parse(todo);
            ssn.stocks[index].current_price = parseFloat(obj[0].lastSalePrice);
            ssn.stocks[index].current_value = Math.round(ssn.stocks[index].current_price * parseInt(ssn.stocks[index].quantity) * 100) / 100;
            ssn.stocks[index].change = Math.round((ssn.stocks[index].money_invested - ssn.stocks[index].current_value) * 100) / 100;
            console.log("Money invested: " + ssn.stocks[index].money_invested);
            console.log("Current value: " + ssn.stocks[index].current_value);
            console.log("Change: " + ssn.stocks[index].change);
            if (index + 1 == ssn.stocks.length) {
               renderHome(req, res);
            } else {
               callback(req, res, index + 1, getCurrentPrice)
            }
         });
      }
   ).on("error", (error) => {
      console.log("Error: " + error.message);
   });
}

function renderHome(req, res) {
   ssn = req.session

   res.render('pages/home', {
      userId: ssn.user_id,
      money: Math.round(ssn.money * 100) / 100,
      stocks: ssn.stocks
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
         pool.query(query, [email], function(err, result) {
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

         var hash = result.rows[0].password;         
        
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
      }
   });
}

function searchStocks(req, res) {

   /*
   var symbolLookupUrl = "http://d.yimg.com/autoc.finance.yahoo.com/autoc?query=" + req.query.symbol + "&region=1&lang=en";

   https.get(
      symbolLookupUrl,
      (response) => {
         let todo = '';
         response.on('data', (chunk) => {
            todo += chunk;
         });

         response.on('end', () => {
            console.log(todo);
         })
      }
   )
   */

   var url = apiUrl + "stable/tops?symbols=" + req.query.symbol + "&token=" + process.env.STOCK_API_KEY;


   https.get(
      url,
      (response) => {
         let todo = '';
         response.on('data', (chunk) => {
            todo += chunk;
         });

         response.on('end', () => {
            console.log(todo);
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

   var symbol = req.query.symbol;
   var price = parseFloat(req.query.price);
   var quantity = parseInt(req.query.quantity);

   pool.query("SELECT money FROM users WHERE id=" + user_id + "LIMIT 1;", function(err, result) {
      if (err) {
         console.log("Error running query. ", err);
      } else {
         var money = Math.round(result.rows[0].money * 100) / 100;
         var dMoney = Math.round(price * quantity * 100) / 100;

         console.log(money + ((money < dMoney) ? " < " : " > ") + dMoney);

         if (money < dMoney) {
            res.send("Insufficient funds.");
            res.end();
         } else {
            // Check if user has already purchased that stock
            pool.query("SELECT id, money_invested, quantity FROM stocks WHERE symbol=$1 AND user_id=$2", [symbol, ssn.user_id], function(err, result ) {
               if (err) {
                  console.error("Error running query. ", err);
               } else {
                  if (result.rows.length == 0) {
                     var query = "INSERT INTO stocks (symbol, money_invested, quantity, user_id) VALUES ('" + symbol + "', " + (price * quantity) + ", " + quantity + ", " + user_id + ");";
            
                     pool.query(query, function (err, result) {
                        if (err) {
                           console.error("Error running query. ", err);
                        } else {
                           pool.query("UPDATE users SET money=" + (money - dMoney) + " WHERE id=" + user_id + " RETURNING money;", function(err, result) {
                              if (err) {
                                 console.error("Error updating user " + user_id, err);
                              } else {
                                 res.send(result.rows[0].money);
                                 res.end();
                              }
                           });
                        }
                     });
                  } else {
                     var updatedMoney = Math.round((parseFloat(result.rows[0].money_invested) + dMoney) * 100) / 100;
                     var updatedQuantity = parseInt(result.rows[0].quantity) + quantity;
                     pool.query("UPDATE stocks SET money_invested=$1, quantity=$2 WHERE id=$3", [updatedMoney, updatedQuantity, result.rows[0].id], function(err, result) {
                        if (err) {
                           console.error("Error running query. ", err);
                        } else {
                           pool.query("UPDATE users SET money=" + (money - dMoney) + "WHERE id=" + user_id + " RETURNING money;", function(err, result) {
                              if (err) {
                                 console.error("Error updating user " + user_id, err);
                              } else {
                                 res.send(result.rows[0].money);
                                 res.end();
                              }
                           });
                        }
                     });
                  }
               }
            });
         }
      }
   });
}

function sell(req, res) {
   ssn = req.session;

   var user_id = ssn.user_id;

   var symbol = req.query.symbol;
   var quantity = parseInt(req.query.quantity);

   var index = 0;

   for (index; index < ssn.stocks.length; index++) {
      if (ssn.stocks[index].symbol == symbol) {
         break;
      }
   }

   if (quantity > parseInt(ssn.stocks[index].quantity)) {
      res.send("Invalid quantity");
   } else {
      var value = ssn.stocks[index].current_price * quantity;
      
      var query = "SELECT id, money_invested, quantity FROM stocks WHERE symbol=$1 AND user_id=$2";
      pool.query(query, [symbol, user_id], function(err, result) {
         if (err) {
            console.error("Error running query. ", err);
         } else {
            var id = result.rows[0].id;
            var money = result.rows[0].money_invested - value;
            var quant = result.rows[0].quantity - quantity;
            
            if (quantity == result.rows[0].quantity) {
               // DELETE the stock
               query = "DELETE FROM stocks WHERE id=$1";
               pool.query(query, [id], function(err, result) {
                  if (err) {
                     console.error("Error deleting stock. ", err);
                  } else {
                     updateUserMoney(value, req.session, res);
                  }
               });
            } else {
               // UPDATE the stock
               query = "UPDATE stocks SET money_invested=$1, quantity=$2 WHERE id=$3";
               pool.query(query, [money, quant, id], function(err, result) {
                  if (err) {
                     console.error("Error updating stock " + id, err);
                  } else {
                     updateUserMoney(value, req.session, res);
                  }
               });
            }
            
         }
      });
   }
}

function updateUserMoney(value, session, res) {
   var updateMoney = parseFloat(session.money) + parseFloat(value);
   pool.query("UPDATE users SET money=$1 WHERE id=$2", [updateMoney, session.user_id], function(err, result) {
      if (err) {
         console.error("Error updating money for user " + session.user_id + ": ", err);
      } else {
         res.send("User updated");
      }
   });
}