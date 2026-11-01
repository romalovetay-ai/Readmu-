# Telegram MCP Setup Guide

This guide walks through setting up the telegram-mcp server for use with Claude Code.

## Prerequisites

- Python 3.10+
- uv (Python package manager)
- Telegram account
- Telegram API credentials (get from https://my.telegram.org)

## Step 1: Get Telegram API Credentials

1. Go to https://my.telegram.org
2. Log in with your phone number
3. Click "API development tools"
4. Create a new application (any name/platform)
5. Note your `api_id` and `api_hash`

## Step 2: Clone and Install

```bash
# Clone the repository
git clone https://github.com/chigwell/telegram-mcp.git
cd telegram-mcp

# Install dependencies
uv sync
```

## Step 3: Create Environment File

Create a `.env` file in the telegram-mcp directory:

```bash
# Telegram API Credentials
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash

# Session Management
TELEGRAM_SESSION_NAME=claude_session
```

## Step 4: Generate Session String

This step requires manual interaction (entering phone number and code):

```bash
uv run python session_string_generator.py
```

Follow the prompts:
1. Enter your phone number (with country code, e.g., +1234567890)
2. Enter the verification code sent to your Telegram
3. Enter 2FA password if enabled

The script will output a session string. Add it to your `.env`:

```bash
TELEGRAM_SESSION_STRING=your_generated_session_string
```

## Step 5: Add to Claude Code

```bash
# Add the MCP server to Claude Code
claude mcp add telegram-mcp -s user -- uv run --directory /path/to/telegram-mcp python main.py

# Verify it was added
claude mcp list
```

Replace `/path/to/telegram-mcp` with the actual path to your cloned repository.

## Step 6: Restart Claude Code

Close and reopen Claude Code for the MCP server to be available.

## Verification

Test the setup by asking Claude Code to list your Telegram chats:

```
"Show me my recent Telegram chats"
```

If working correctly, you should see a list of your chats.

---

## Troubleshooting

### "Could not find the input entity for PeerUser"

**Cause**: The chat ID format is incorrect.

**Fix**:
- For users: Use the numeric ID directly
- For groups: Use the group name or ID
- For supergroups/channels: Prepend `-100` to the ID (e.g., `-1001234567890`)

### "Session expired" or authentication errors

**Cause**: The session string may be invalid or expired.

**Fix**: Regenerate the session string:
```bash
uv run python session_string_generator.py
```

### MCP server not appearing in Claude Code

**Cause**: Server not properly registered or path is incorrect.

**Fix**:
1. Check the server list: `claude mcp list`
2. Remove and re-add if needed: `claude mcp remove telegram-mcp`
3. Ensure the path to main.py is absolute

### Rate limiting / FloodWait errors

**Cause**: Too many API requests in a short time.

**Fix**: Wait the specified time (shown in error) before retrying. Space out requests.

### Draft not appearing in Telegram

**Cause**: Drafts are per-chat and may need app refresh.

**Fix**:
1. Open the specific chat in Telegram app
2. The draft should appear in the input field
3. Try closing and reopening the chat

---

## Security Notes

1. **Session String = Full Access**: Treat your session string like a password. Anyone with it can access your Telegram account.

2. **Keep .env Private**: Never commit `.env` to version control.

3. **Review Before Sending**: Always use `save_draft` for important messages. Review in Telegram before sending.

4. **Monitor Activity**: Telegram shows active sessions in Settings > Privacy > Active Sessions.

---

## Resources

- **telegram-mcp repo**: https://github.com/chigwell/telegram-mcp
- **Telethon docs**: https://docs.telethon.dev
- **Telegram API docs**: https://core.telegram.org/api
