const nodemailer = require('nodemailer');

// Mock email sending for testing
const sendEmail = async (to, subject, text) => {
  if (process.env.NODE_ENV === 'test') {
    console.log('Mock email sent:', { to, subject, text });
    return;
  }

  // Real email sending logic would go here
  console.log('Email sending not implemented in development');
};

module.exports = sendEmail; 