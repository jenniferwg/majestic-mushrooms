const express = require('express');
const router = express.Router();
const middleware = require('../middleware');
const nylas = require('../../config/nylasToken.js');
const secrets = require('docker-secrets');
const CLIENT_ID = secrets.NYLAS_CLIENT_ID || nylas.CLIENT_ID;
const CLIENT_SECRET = secrets.NYLAS_CLIENT_SECRET || nylas.CLIENT_SECRET;
const axios = require('axios');
const querystring = require('querystring');


router.route('/')
  .get(middleware.auth.verify, (req, res) => {
    res.render('index.ejs');
  });

router.route('/authenticated')
  .get((req, res) => {
    axios.post('https://api.nylas.com/oauth/token', 
      querystring.stringify(
        { client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          grant_type: 'authorization_code',
          code: res.req.query.code 
        }))
    .then( (response) => {
      var token = response.data.access_token;
      res.locals.token = token;
      res.render('index.ejs');
    }) 
    .catch( err => { console.log('ERROR ', err); });
  });


router.route('/login')
  .get((req, res) => {
    res.render('login.ejs', { message: 'You should login' });
  })
  .post(middleware.passport.authenticate);

router.route('/signup')
  .get((req, res) => {
    res.render('signup.ejs', { message: 'You should signup' });
  })
  .post(middleware.passport.authenticate); 

router.route('/profile')
  .get(middleware.auth.verify, (req, res) => {
    res.render('profile.ejs', {
      user: req.user // get the user out of session and pass to template
    });
  });

router.route('/logout')
  .get((req, res) => {
    req.logout();
    res.redirect('/');
  });


module.exports = router;