CREATE TABLE users (
   id SERIAL NOT NULL PRIMARY KEY,
   email varchar(255) NOT NULL,
   password varchar NOT NULL,
   money decimal
);

CREATE TABLE stocks (
   id SERIAL NOT NULL PRIMARY KEY,
   symbol varchar(255) NOT NULL,
   money_invested decimal NOT NULL,
   quantity integer NOT NULL,
   user_id integer references users (id)
);