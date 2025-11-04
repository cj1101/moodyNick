# Figma MCP Setup Guide for Cursor IDE

This guide will help you set up Figma MCP (Model Context Protocol) integration with Cursor IDE, allowing you to generate code directly from Figma designs.

## Prerequisites

✅ **Node.js**: Already installed (v22.14.0)  
⚠️ **Figma API Token**: You'll need to generate this (see Step 1)

## Step 1: Generate Figma API Token

1. **Log into Figma:**
   - Open Figma Desktop App or go to https://www.figma.com
   - Sign in to your account

2. **Navigate to Settings:**
   - Click on your profile icon (top right)
   - Select **Settings**

3. **Generate Personal Access Token:**
   - Go to the **Security** section
   - Scroll down to **Personal Access Tokens**
   - Click **"Generate new token"**
   - Give it a descriptive name (e.g., "Cursor MCP")
   - **IMPORTANT**: Copy the token immediately - it will only be shown once!
   - Save it securely (you'll need it in Step 2)

## Step 2: Install and Run Figma MCP Server

Open your terminal in this project directory and run:

```bash
npx @figma/mcp-server --figma-api-key=YOUR_FIGMA_API_KEY
```

**Replace `YOUR_FIGMA_API_KEY`** with the token you generated in Step 1.

**Example:**
```bash
npx @figma/mcp-server --figma-api-key=figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

This will:
- Install the Figma MCP server package
- Start the server on `http://localhost:3333`
- Keep the server running (don't close the terminal)

**Note:** The server needs to stay running while you use Figma MCP in Cursor. You can run it in the background or keep the terminal window open.

## Step 3: Configure Cursor IDE

1. **Open Cursor Settings:**
   - Open Cursor IDE
   - Press `Ctrl+,` (or go to **File** > **Preferences** > **Settings**)
   - Or use the command palette: `Ctrl+Shift+P` and search for "Preferences: Open Settings"

2. **Navigate to MCP Settings:**
   - In the settings search bar, type: `MCP`
   - Or go to **Features** > **MCP** in the settings sidebar

3. **Add Figma MCP Server:**
   - Click **"+ Add New MCP Server"** or **"Add Server"**
   - Fill in the configuration:
     - **Name**: `Figma MCP`
     - **Type**: Select `SSE` (Server-Sent Events)
     - **URL**: `http://localhost:3333`
   - Click **Save** or **OK**

4. **Verify Connection:**
   - The server should appear in your MCP servers list
   - Check that the status indicator is green (connected)
   - If it's red or shows an error, make sure the MCP server is running (Step 2)

## Step 4: Use Figma MCP in Cursor

Once configured, you can use Figma designs directly in Cursor:

1. **In Figma:**
   - Select the design component or frame you want to implement
   - Right-click and choose **Copy/Paste As** > **Copy Link to Selection**
   - Or use: `Ctrl+Alt+L` (Windows) / `Cmd+Opt+L` (Mac)

2. **In Cursor:**
   - Open Cursor's Composer (Agent Mode)
   - Paste the Figma link
   - Prompt Cursor to generate code, for example:
     ```
     Generate a React component using Tailwind CSS based on this Figma design.
     ```

3. **Cursor will:**
   - Fetch the design data from Figma via the MCP server
   - Analyze the design structure, colors, spacing, typography
   - Generate accurate code matching the design

## Troubleshooting

### Server Won't Start
- **Check Node.js version**: Ensure you have Node.js v16 or later (you have v22.14.0 ✅)
- **Check port availability**: Make sure port 3333 is not in use by another application
- **Check API token**: Verify your Figma API token is correct

### Cursor Can't Connect to Server
- **Verify server is running**: Check that the terminal showing the MCP server is still open
- **Check URL**: Ensure the URL in Cursor settings is exactly `http://localhost:3333`
- **Restart Cursor**: Sometimes you need to restart Cursor after adding MCP servers

### Outdated Package Warning
- **Security Note**: Make sure you're using `@figma/mcp-server` version 0.6.3 or later
- Update by running: `npx @figma/mcp-server@latest --figma-api-key=YOUR_KEY`

## Alternative: Using Package Name Instead of @figma/mcp-server

If `@figma/mcp-server` doesn't work, you can try:

```bash
npx figma-developer-mcp --figma-api-key=YOUR_FIGMA_API_KEY
```

## Running the Server in Background (Windows PowerShell)

To run the server in the background so you can keep using your terminal:

```powershell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npx @figma/mcp-server --figma-api-key=YOUR_FIGMA_API_KEY"
```

## Next Steps

Once set up, you can:
- Copy Figma design links and have Cursor generate components
- Iterate on designs by updating Figma and regenerating code
- Maintain design-code consistency automatically

## Resources

- [Figma MCP on Cursor Directory](https://cursor.directory/mcp/figma)
- [Figma API Documentation](https://www.figma.com/developers/api)
- [Cursor MCP Documentation](https://docs.cursor.com)

---

**Security Reminder**: Never commit your Figma API token to version control. Keep it secure and only use it in your local development environment.



