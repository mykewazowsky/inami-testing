const express = require('express');
const router = express.Router();

const {
  forgotPasswordFirebase
} = require('../controllers/authController');

router.post('/forgot-password-firebase', (req, res, next) => {
  console.log("Route hit: forgot-password-firebase", req.body);
  next();
}, forgotPasswordFirebase);

module.exports = router;

