const { body, validationResult } = require('express-validator');

const validateLocation = [
    body('name').not().isEmpty().withMessage('Name is required'),
    // Add more validation rules as needed
  ];
  
  const validateUserRegistration = [
    body('userName').not().isEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Invalid email address'),
    // Add more validation rules for user registration
  ];

  module.exports = {
    validateLocation,
    validateUserRegistration,
  };
  