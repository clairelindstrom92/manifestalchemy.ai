# Deployment Guide for Manifest Alchemy AI

## Setting up HuggingFace API Key in Vercel

If you're getting errors on manifestalchemy.ai, follow these steps:

### 1. Get your HuggingFace API Key
1. Go to https://huggingface.co/settings/tokens
2. Create a new access token with "Read" permissions
3. Copy the token (it starts with `hf_...`)

### 2. Add the environment variable in Vercel
1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project (manifestalchemyai)
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Set the following:
   - **Key**: `HUGGINGFACE_API_KEY`
   - **Value**: Your HuggingFace token (paste it here)
   - **Environment**: Select all (Production, Preview, Development)
6. Click **Save**

### 3. Redeploy your application
1. Go to the **Deployments** tab in Vercel
2. Click the **...** menu on your latest deployment
3. Select **Redeploy**
4. Wait for the deployment to complete

### 4. Verify the setup
1. Visit https://manifestalchemy.ai
2. Try sending a message in the chat
3. Check the browser console (F12) and Vercel logs if errors persist

### 5. Debug the Environment Variables
Visit: `https://manifestalchemy.ai/api/debug`

This will show you:
- If the API key is configured
- A preview of your API key (first 8 characters)
- The environment (production/preview/development)

## Troubleshooting

### Common Issues

#### Issue 1: "Error: HuggingFace API key is not configured"
**Solution:**
- Verify the environment variable is named exactly `HUGGINGFACE_API_KEY` (case-sensitive)
- Make sure you redeployed after adding the variable
- Check that the variable is added to the correct environment (Production/Preview/Development)

#### Issue 2: "Error: Invalid HuggingFace API key"
**Solution:**
- Verify your API key is correct
- Generate a new token at https://huggingface.co/settings/tokens
- Make sure the token has "Read" permissions

#### Issue 3: "Error: Rate limit exceeded" or "429 error"
**Solution:**
- Free HuggingFace accounts have API rate limits
- Wait a few minutes and try again
- Consider upgrading to a paid HuggingFace plan

#### Issue 4: "Error: HuggingFace models are not available"
**Solution:**
- Some models require special access or are gated
- The app now tries multiple models automatically
- Check Vercel logs for detailed error messages

### How to Check Vercel Logs
1. Go to Vercel Dashboard
2. Click on your project
3. Go to **Deployments** tab
4. Click on the latest deployment
5. Click **Functions** tab
6. Click on the function that failed
7. View the logs to see detailed error messages

### Testing Locally

1. Create a `.env.local` file in the project root:
```
HUGGINGFACE_API_KEY=your_token_here
```

2. Run the development server:
```bash
npm run dev
```

3. Visit http://localhost:3000

4. Test the debug endpoint: http://localhost:3000/api/debug
