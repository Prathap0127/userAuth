const emailjs = require("@emailjs/nodejs");

const sendEmail = async ({
  recipient,
  to_name,
  subject,
  link1,
  message1,
  message2,
}) => {
  const templateParams = {
    recipient,
    to_name,
    subject,
    link1,
    message1,
    message2,
  };

  emailjs
    .send(
      process.env.EMAIL_SERVICE_ID,
      process.env.EMAIL_ACTIVATION_TEMPLATE,
      templateParams,
      {
        publicKey: process.env.EMAIL_PUBLIC_KEY,
        privateKey: process.env.EMAIL_PRIVATE_KEY,
      }
    )
    .then(
      (response) => {
        console.log("SUCCESS!", response.status, response.text);
      },
      (error) => {
        console.log("FAILED...", error);
      }
    );
};

module.exports = sendEmail;
