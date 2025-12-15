# Google Gemini API Setup

## Getting Your API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

## Adding to Environment Variables

1. Open the `.env` file in the `backend` directory
2. Add the following line:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
3. Replace `your_api_key_here` with your actual API key
4. Save the file

## Important Notes

- **Keep your API key secret** - Never commit it to version control
- The `.env` file is already in `.gitignore` to protect your keys
- Google Gemini has a generous free tier (60 requests per minute)
- For this expense tracker, you should stay well within free limits

## Example .env File

Your `.env` file should look like this:

```
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
GOOGLE_CLIENT_ID=your_google_client_id
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
```
