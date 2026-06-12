const AfricasTalking = require('africastalking');
require('dotenv').config();

console.log('AT Username:', process.env.AT_USERNAME);
console.log('AT API Key starts with:', process.env.AT_API_KEY?.slice(0, 10));

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
    console.log('Sending SMS to:', phoneNumber);
    console.log('Message:', message);

    const result = await sms.send({
      to:      [phoneNumber],
      message: message,
      from:    process.env.AT_SENDER_ID || 'MEDLYNK',
    });

    console.log('AT Full Response:', JSON.stringify(result, null, 2));

    const recipient = result.SMSMessageData.Recipients[0];
    console.log('Recipient status:', recipient.status);
    console.log('Recipient statusCode:', recipient.statusCode);

    return {
      success: recipient.status === 'Success' || recipient.statusCode === 101,
      status:  recipient.status,
      cost:    recipient.cost,
      number:  phoneNumber,
    };

  } catch (err) {
    console.error('SMS send FULL error:', err);
    return {
      success: false,
      error:   err.message,
    };
  }
};

module.exports = { sendOTP };