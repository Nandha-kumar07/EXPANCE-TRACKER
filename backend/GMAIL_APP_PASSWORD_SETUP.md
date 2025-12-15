# Gmail App Password Setup Guide

## Problem
Emails are not being sent because Gmail requires an **App Password** instead of your regular account password when using nodemailer.

## Solution Steps

### Step 1: Enable 2-Factor Authentication (2FA)
1. Go to your Google Account: https://myaccount.google.com/
2. Click on **Security** in the left sidebar
3. Under "How you sign in to Google", click on **2-Step Verification**
4. Follow the prompts to enable 2FA (you'll need your phone)

### Step 2: Generate App Password
1. After enabling 2FA, go back to: https://myaccount.google.com/security
2. Under "How you sign in to Google", click on **2-Step Verification**
3. Scroll down to the bottom and click on **App passwords**
4. You may need to sign in again
5. In the "Select app" dropdown, choose **Mail**
6. In the "Select device" dropdown, choose **Other (Custom name)**
7. Type a name like "Expense Tracker App"
8. Click **Generate**
9. Google will show you a 16-character password (e.g., `abcd efgh ijkl mnop`)
10. **Copy this password immediately** (you won't be able to see it again)

### Step 3: Update Your .env File
Replace the `EMAIL_PASS` in your `.env` file with the App Password:

```env
EMAIL_USER="itmenk07122004@gmail.com"
EMAIL_PASS="abcdefghijklmnop"  # Replace with your 16-character app password (no spaces)
```

**Important:** Remove all spaces from the app password when pasting it.

### Step 4: Restart Your Backend Server
1. Stop the backend server (Ctrl+C in the terminal)
2. Run `npm run dev` again

## Testing
After setting up the app password:
1. Go to the Forgot Password page in your app
2. Enter a registered email address
3. Click "Send Reset Link"
4. Check your email inbox (and spam folder)

## Troubleshooting

### If emails still don't work:
1. **Check the backend console** for error messages
2. **Verify the app password** has no spaces
3. **Check Gmail settings** - make sure "Less secure app access" is OFF (we're using app passwords, which is more secure)
4. **Try a different email service** (optional) - You can use services like SendGrid, Mailgun, or Ethereal for testing

### Alternative: Use Ethereal Email (for testing only)
If you want to test without setting up Gmail:

1. Install ethereal: `npm install nodemailer`
2. Update the email transporter in `server.js`:

```javascript
// For testing only - creates a test account
const transporter = await nodemailer.createTestAccount().then(account => {
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: account.user,
      pass: account.pass
    }
  });
});
```

This will log a preview URL in the console where you can see the email.

## Security Note
⚠️ **Never commit your `.env` file to Git!** Make sure `.env` is in your `.gitignore` file.
