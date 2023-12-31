const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const auth = require("./auth");
// require database connection 
const dbConnect = require("./db/dbConnect");
const User = require("./db/userModel");
// execute database connection 
dbConnect();

// Curb Cores Error by adding a header here
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

// body parser configuration
app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (request, response, next) => {
  response.json({ message: "Hey! This is your server response!" });
  next();
});

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(String(password), salt)
  return hashedPassword
}


app.post("/register", async(request, response) => {
// hash the password
const email = request.body.email;
const hashedPassword = await hashPassword(request.body.password);
const user = new User({
    email: email,
    password: hashedPassword,
  });

  // save the new user  // return success if the new user is added to the database successfully
  user.save().then((result) => {
      response.status(201).send({
        message: "User Created Successfully",
        result,
      });
    })
    // catch erroe if the new user wasn't added successfully to the database
    .catch((error) => {
      response.status(500).send({
        message: "Error creating user",
        error,
      });
    });
  });


  // login endpoint
  app.post("/login", (request, response) => {
    // check if email exists
    User.findOne({ email: request.body.email })
  
      // if email exists
      .then((user) => {
        // compare the password entered and the hashed password found
        bcrypt
          .compare(request.body.password, user.password)
  
          // if the passwords match
          .then((passwordCheck) => {
  
            // check if password matches
            if(!passwordCheck) {
              return response.status(400).send({
                message: "Passwords does not match",
                error,
              });
            }
  
            //   create JWT token
            const token = jwt.sign(
              {
                userId: user._id,
                userEmail: user.email,
              },
              "RANDOM-TOKEN",
              { expiresIn: "24h" }
            );
  
            //   return success response
            response.status(200).send({
              message: "Login Successful",
              email: user.email,
              token,
              userData : {
                userId: user._id,
                userEmail: user.email,
                userPassword: user.password
              }
            });
          })
          // catch error if password does not match
          .catch((error) => {
            response.status(400).send({
              message: "Passwords does not match",
              error,
            });
          });
      })
      // catch error if email does not exist
      .catch((e) => {
        response.status(404).send({
          message: "Email not found",
          e,
        });
      });
  });

  // free endpoint
app.get("/free-endpoint", (request, response) => {
  response.json({ message: "You are free to access me anytime" });
});

// authentication endpoint
app.get("/auth-endpoint", auth, (request, response) => {
  response.json({ message: "You are authorized to access me" });
});

module.exports = app;
