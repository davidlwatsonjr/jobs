const twilio = require("twilio");

require("dotenv").config();
const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_FROM_NUMBER,
  TWILIO_TO_NUMBER,
} = process.env;

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const sendText = async (message) => {
  return await twilioClient.messages.create({
    body: message,
    from: TWILIO_FROM_NUMBER,
    to: TWILIO_TO_NUMBER,
  });
};

module.exports = {
  sendText
};