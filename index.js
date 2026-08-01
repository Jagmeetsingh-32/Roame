const { Auth, LoginCredentials } = require("two-step-auth");

// Optional: configure your own email credentials
LoginCredentials.mailID = process.env.MY_EMAIL; // your email
LoginCredentials.password = process.env.MY_PASSWORD; // your email password
LoginCredentials.use = true; // enable custom email usage

// Function to send OTP
async function sendOTP(emailId) {
  try {
    // "Company Name" appears in the email sender for importance
    const res = await Auth(emailId, "Company Name"); 
    console.log("Email sent to:", res.mail);
    console.log("OTP:", res.OTP);
    console.log("Success:", res.success);
    return res.OTP;
  } 
  catch (error) {
    // ✅ UNCOMMENT THIS: Always catch errors so your server doesn't crash!
    console.log("Error sending OTP:", error.message);
    return null;
  }
}

// ❌ COMMENT THIS OUT OR DELETE IT:
// sendOTP("user@example.com"); 
