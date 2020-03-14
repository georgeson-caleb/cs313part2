CREATE TABLE users (
   id SERIAL NOT NULL PRIMARY KEY,
   email varchar(255) NOT NULL,
   password varchar NOT NULL,
   money decimal
);

CREATE TABLE stocks (
   id SERIAL NOT NULL PRIMARY KEY,
   stock_name varchar(255) NOT NULL,
   bought_price decimal NOT NULL,
   user_id integer references users (id)
);