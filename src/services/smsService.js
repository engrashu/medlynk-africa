const AfricasTalking = require('africastalking');
require('dotenv').config();

const client = AfricasTalking({
  username: process.env.AT_USERNAME,
  apiKey:   process.env.AT_API_KEY,
});

const sms = client.SMS;

const sendOTP = async (phoneNumber, otp, language = 'fr') => {
  const message = language === 'fr'
    ? `Votre code Medlynk Africa est: ${otp}. Valable 10 minutes. Ne le partagez pas.`
    : `Your Medlynk Africa code is: ${otp}. Valid for 10 minutes. Do not share it.`;

  try {
    const result = await sms.send({
      to:      [phoneNumber],
      message: message,
    });

    console.log('SMS result:', JSON.stringify(result));
    const recipient = result.SMSMessageData.Recipients[0];

    return {
      success: recipient.status === 'Success' || recipient.statusCode === 101,
      status:  recipient.status,
      cost:    recipient.cost,
      number:  phoneNumber,
    };

  } catch (err) {
    console.error('SMS error:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = { sendOTP };