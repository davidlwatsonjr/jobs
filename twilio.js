const twilio = require("twilio");

require("dotenv").config();
const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_FROM_NUMBER,
} = process.env;

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const sendText = async (message, toNumber) => {
  return await twilioClient.messages.create({
    body: message,
    from: TWILIO_FROM_NUMBER,
    to: toNumber,
  });
};

module.exports = {
  sendText
};