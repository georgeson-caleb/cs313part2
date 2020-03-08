const express = require('express')
const path = require('path')
const url = require('url')
const PORT = process.env.PORT || 5000

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .get('/calculatePostage', (req, res) => calculatePostage(req, res))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))


  function calculatePostage(req, res) {
   var parsedUrl = url.parse(req.url, true)
   var params = parsedUrl.query
   var price
   var type

   switch (parseInt(params.type)) {
      case 0:
         price = getStampedPrice(parseFloat(params.weight))
         type = "Letter (Stamped)"
         break
      case 1:
         price = getMeteredPrice(parseFloat(params.weight))
         type = "Letter (Metered)"
         break
      case 2:
         price = getLargeEnvelopePrice(parseFloat(params.weight))
         type = "Large Envelope"
         break
      case 3:
         price = getParcelPrice(parseFloat(params.weight))
         type = "First-Class Package Service"
         break
   }

   price = "$ " + price
   
   res.render('pages/results', {
      weight: params.weight,
      type: type,
      price: price
   })
}

function getStampedPrice(weight) {
   if (weight <= 1) {
      return "0.55"
   } else if (weight <= 2) {
      return "0.70"
   } else if (weight <= 3) {
      return "0.85"
   } else if (weight <= 3.5) {
      return "1.00"
   } else {
      return "Error: too heavy for letter"
   }
}

function getMeteredPrice(weight) {
   if (weight <= 1) {
      return "0.50"
   } else if (weight <= 2) {
      return "0.65"
   } else if (weight <= 3) {
      return "0.80"
   } else if (weight <= 3.5) {
      return "0.95"
   } else {
      return "Error: too heavy for letter"
   }
}

function getLargeEnvelopePrice(weight) {
   for (var i = 1; i <= 13; i++) {
      if (weight <= i) {
         return 1 + ((i - 1) * 0.2)
      }
   }
   return "Error: too heavy"
}

function getParcelPrice(weight) {
   if (weight <= 4) {
      return "3.80"
   } else if (weight <= 8) {
      return "4.60"
   } else if (weight <= 12) {
      return "5.30"
   } else if (weight <= 13) {
      return "5.90"
   } else {
      return "Error: too heavy"
   }
}
