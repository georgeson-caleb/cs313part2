function createAccount() {
   var email = document.getElementById("email").value;
   var password = document.getElementById("password").value;
   var password_verify = document.getElementById("password_verify").value;

   if (password == password_verify) {
      hideError("signup_error");
      sendCreateAccountRequest(email, password);
   } else {
      showError("signup_error", "Passwords must match.");
   }
}

function login() {
   var email = document.getElementById("login_email").value;
   var password = document.getElementById("login_password").value;

   $.post(
      "/login",
      {
         email: email,
         password: password
      },
      processLoginRequest
   );
}

function sendCreateAccountRequest(email, password) {
   $.post(
      "/createAccount", 
      {
         email: email,
         password: password
      },
      processAccountCreationResponse
   );
}

function logData(response) {
   console.log(response);
}

function processAccountCreationResponse(response) {
   if (response == "invalid") {
      showError("signup_error", "Email has already been used.")
   } else {
      window.location = "/home";
   }
}

function processLoginRequest(response) {
   logData(response);
   if (response == "invalid"){
      showError("login_error", "Invalid credentials");
   } else {
      window.location = "/home";
   }
}

function showError(id, message) {
   document.getElementById(id).innerHTML = message;
   document.getElementById(id).style.display = "block";
}

function hideError(id) {
   document.getElementById(id).style.display = "none";
}

function searchStocks() {
   var symbol = document.getElementById("search").value;
   
   $.get(
      "/searchStocks",
      {
         symbol: symbol
      }, 
      displaySearchResult
   );
   
}

function processSymbolSearchResult(result) {
   console.log(JSON.parse(result));
}

function displaySearchResult(result) {
   var data = JSON.parse(result);
   var string = "";
   if (data.length > 0) {
      string = "Name: " + data[0].symbol + "<br>Price: " + data[0].lastSalePrice + 
      "<input type='number' id='quantity' placeholder='Quantity'>" +
      "<button onclick='purchaseStocks(" + '"' + data[0].symbol + '"' + ", " + 
      data[0].lastSalePrice + ")'>Purchase</button>";
   } else {
      string = "No results.";
   }
   
   document.getElementById("searchResult").innerHTML = string;
}

function purchaseStocks(symbol, price) {
   var quantity = document.getElementById("quantity").value;

   $.get(
      "/purchase",
      {
         symbol: symbol,
         price: price,
         quantity: quantity
      },
      (response) => window.location = "/home"
   );
}

function sell(elem) {
   var symbol = elem.parentNode.parentNode.firstChild.nextElementSibling.innerHTML.replace(/^\s+|\s+$/g, '');
   var quantity = elem.parentNode.firstChild.nextElementSibling.value;

   $.get(
      "/sell",
      {
         symbol: symbol,
         quantity: quantity
      },
      (response) => window.location = "/home"
   );
}