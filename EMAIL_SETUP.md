# Email Configuration Instructions

## Step 1: Get Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** (left sidebar)
3. Enable **2-Step Verification** if not already enabled
4. Scroll down to **App Passwords**
5. Click **App Passwords**
6. Select:
   - App: **Mail**
   - Device: **Other (Custom name)** → Type "SafeEvac"
7. Click **Generate**
8. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

## Step 2: Update .env File

Add these lines to your `.env` file:

```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
```

Replace:
- `your-email@gmail.com` with your Gmail address
- `abcd efgh ijkl mnop` with your generated app password (remove spaces)

## Step 3: Restart Backend Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
node server.js
```

## Example .env File

```
MONGODB_URI=mongodb://localhost:27017/safeevac
VITE_GEMINI_API_KEY=your-gemini-key
VITE_GH_API_KEY=49334d57-bbc8-4e2e-8d8b-c0fe730fae43
EMAIL_USER=safeevac.alerts@gmail.com
EMAIL_PASS=abcdefghijklmnop
```

## Testing

1. Set emergency email in Profile page
2. Click SOS button
3. Check:
   - Backend console shows "✅ Email sent successfully"
   - Emergency contact receives email
   - Email has professional HTML formatting

## Troubleshooting

**Error: "Invalid login"**
- Make sure 2-Step Verification is enabled
- Use App Password, not regular Gmail password
- Remove spaces from app password

**Error: "Connection timeout"**
- Check internet connection
- Gmail SMTP might be blocked by firewall
- Try using port 587 instead of 465

**Email not received**
- Check spam/junk folder
- Verify emergency email is correct in Profile
- Check backend console for errors
