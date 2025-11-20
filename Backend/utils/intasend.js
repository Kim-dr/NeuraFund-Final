const IntaSend = require('intasend-node');
require('dotenv').config();

const isTest = process.env.INTASEND_IS_TEST === 'true';


// 🔍 DEBUG LOGGING (Remove this after it works!)
console.log("--- INTASEND CONFIG DEBUG ---");
console.log("Is Test Mode:", isTest);
console.log("Pub Key Loaded:", process.env.INTASEND_PUBLISHABLE_KEY);
console.log("Secret Key Loaded:", process.env.INTASEND_SECRET_KEY ? "Yes (Hidden)" : "NO - MISSING!");
console.log("-----------------------------");

const intasend = new IntaSend(
  process.env.INTASEND_PUBLISHABLE_KEY,
  process.env.INTASEND_SECRET_KEY,
  isTest 
);
// 1. Trigger STK Push (Vendor Deposit)
const triggerMpesaStkPush = async (phoneNumber, amount, vendorEmail, vendorFirstName, narration = 'NeuraFund Deposit') => {
  try {
    const response = await intasend.collection().mpesaStkPush({
      first_name: vendorFirstName, // ⬅️ NOW DYNAMIC
      last_name: 'User', // Placeholder - last name often not critical
      email: vendorEmail, // ⬅️ NOW DYNAMIC (Uses vendor's real email)
      host: 'https://your-website.com', 
      amount: amount,
      phone_number: phoneNumber,
      api_ref: `DEP-${Date.now()}`,
      narration: narration,
    });
    return response;
  } catch (error) {
    console.error('IntaSend STK Error:', error);
    throw error;
  }
};

// 2. Trigger B2C (Student Withdrawal / Salary)
// Note: B2C requires a funded IntaSend wallet, but works in Sandbox mode for testing.
const triggerMpesaB2C = async (phoneNumber, amount, narration = 'NeuraFund Payout') => {
  try {
    const response = await intasend.payouts().mpesa({
      currency: 'KES',
      transactions: [
        {
          name: 'Student User',
          account: phoneNumber,
          amount: amount,
          narrative: narration,
        },
      ],
    });
    return response;
  } catch (error) {
    console.error('IntaSend B2C Error:', error);
    throw error;
  }
};

module.exports = {
  triggerMpesaStkPush,
  triggerMpesaB2C
};