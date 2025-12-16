import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

console.log("Testing Email Configuration...\n");


console.log("Email User:", process.env.EMAIL_USER);
console.log("Email Pass:", process.env.EMAIL_PASS ? "***" + process.env.EMAIL_PASS.slice(-4) : "NOT SET");
console.log("");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});


console.log("Verifying SMTP connection...");
transporter.verify(function (error, success) {
    if (error) {
        console.error("SMTP Connection Failed!");
        console.error("Error:", error.message);
        console.error("\nCommon Issues:");
        console.error("1. You need to use a Gmail App Password, not your regular password");
        console.error("2. Enable 2-Factor Authentication on your Google Account");
        console.error("3. Generate an App Password from: https://myaccount.google.com/apppasswords");
        console.error("4. Update EMAIL_PASS in .env with the 16-character app password (no spaces)");
        process.exit(1);
    } else {
        console.log("SMTP Connection Successful!");
        console.log("Server is ready to send emails");


        console.log("\nSending test email...");
        transporter.sendMail(
            {
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_USER, 
                subject: "Test Email - Expense Tracker",
                text: "This is a test email from your Expense Tracker application. If you received this, your email configuration is working correctly!",
            },
            (error, info) => {
                if (error) {
                    console.error("Failed to send test email:", error.message);
                    process.exit(1);
                } else {
                    console.log("Test email sent successfully!");
                    console.log("Message ID:", info.messageId);
                    console.log("\nEmail configuration is working perfectly!");
                    console.log("Check your inbox at:", process.env.EMAIL_USER);
                    process.exit(0);
                }
            }
        );
    }
});
