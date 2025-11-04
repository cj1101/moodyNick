# MongoDB Atlas Setup Instructions

Follow these steps to set up your MongoDB Atlas connection for moodyNick:

## Step 1: Verify/Create Database User

1. Go to: https://cloud.mongodb.com/v2/68ca1e05eb96ef25fc843f48#/security/database/users
2. If you don't see any users, click **"Add New Database User"** or **"Create Database User"**
3. Choose **"Password"** authentication method
4. Enter a username (e.g., `moodynick_admin`)
5. Enter a strong password (save this - you'll need it!)
6. Set user privileges to **"Atlas admin"** (or custom with read/write access)
7. Click **"Add User"**

## Step 2: Configure Network Access (Whitelist IPs)

1. Go to: https://cloud.mongodb.com/v2/68ca1e05eb96ef25fc843f48#/security/network/whitelist
2. Click **"Add IP Address"**
3. For development: Click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`)
   - ⚠️ **Note:** This is less secure but convenient for testing
   - For production, add specific IPs instead
4. Click **"Confirm"**

## Step 3: Get Connection String

1. Go to your cluster page: https://cloud.mongodb.com/v2/68ca1e05eb96ef25fc843f48#/clusters
2. Click on the **"moodyNick"** cluster
3. Click the **"Connect"** button
4. Choose **"Connect your application"**
5. Driver: **Node.js**, Version: **5.5 or later**
6. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net国家重点通关/?retryWrites=true&w=majority
   ```
7. Replace:
   - `<username>` with your database username from Step 1
   - `<password>` with your database password from Step 1
   - Optionally add a database name before the `?`, e.g., `/moodynick?`

## Step 4: Update .env File

1. Copy `backend/.env.example` to `backend/.env`
2. Paste your connection string into `DATABASE_URL`
3. Add your `JWT_SECRET` (generate a random string)
4. Add your `PRINTFUL_API_KEY`
5. Save the file

## Example .env File:

```env
DATABASE_URL=mongodb+srv://moodynick_admin:yourpassword@cluster0.xxxxx.mongodb.net/moodynick?retryWrites=true&w=majority
JWT_SECRET=8f7d9c2e1b4a6f3e8d2c7a9b4e1f6d3c8a7b9e4f1c6d2a8e7b4c9f1e6a3d8b2c7
PRINTFUL_API_KEY=your_actual_printful_key_here
NODE_ENV=development
```

## Step 5: Test Connection

1. Make sure your `.env` file is in the `backend/` directory
2. Run: `cd backend && node server.js`
3. You should see: `MongoDB connected` in the logs
4. If you see connection errors, double-check:
   - Username and password are correct
   - Network access is configured (Step 2)
   - Connection string format is correct

## Troubleshooting

- **"Authentication failed"**: Check username/password in connection string
- **"IP not whitelisted"**: Add your IP to Network Access whitelist
- **"Cannot connect"**: Verify cluster is running (not paused)

