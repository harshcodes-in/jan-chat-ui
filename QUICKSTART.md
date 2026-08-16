# Quick Start Guide - Jan Chat UI

## 1. Prerequisites
Ensure you have:
- **Jan Server** running on `http://127.0.0.1:1337/v1`
- **Node.js 16+** and **npm** installed
- **A model loaded** in Jan (e.g., Gemma, Qwen)

## 2. Installation & Launch

### Option A: Development Mode (Recommended for development)
```bash
cd jan-chat-ui
npm install
npm start
```
This opens the app at `http://localhost:4200` with live reload.

### Option B: Production Build
```bash
npm run build
# Outputs to dist/jan-chat-ui/
```
Then serve the `dist` folder using any web server.

## 3. First Time Setup

1. **Open the app** at `http://localhost:4200`
2. **Check the connection**:
   - Look at the sidebar footer for connection status (green dot = connected)
   - If red, verify Jan is running and accessible

3. **Select a model**:
   - The app auto-fetches available models
   - Check the top header for the model selector
   - Select your preferred model from the dropdown

4. **Configure (Optional)**:
   - Click ⚙️ settings icon
   - Adjust Temperature (creativity) - default 0.7 is good
   - Set Max Tokens for response length
   - Customize System Prompt
   - Enable LAN Mode for network access

## 4. Basic Usage

### Sending Messages
1. Type in the input box at the bottom
2. Press **Ctrl+Enter** (or **Cmd+Enter** on Mac) to send
3. Or click the send button (→)

### Working with Responses
- **Copy Code**: Click "📋 Copy" on code blocks
- **Edit Message**: Click ✏️ on any message
- **Delete Message**: Click 🗑️ to remove a message
- **Regenerate Response**: Click 🔄 on AI responses to regenerate

### Managing Conversations
- **New Chat**: Click "+ New Chat" in sidebar to start fresh
- **View History**: Expand the Conversations list in sidebar
- **Load Conversation**: Click any conversation to restore it
- **Delete Conversation**: Click 🗑️ next to a conversation (icon shows on hover)

## 5. Advanced Features

### LAN Mode (Share with other devices)
1. Open Settings (⚙️)
2. Go to "Advanced" section
3. Enable "LAN Mode" checkbox
4. Copy the displayed URL (e.g., `http://192.168.1.100:4200`)
5. Share with devices on your network

### Custom API Endpoint
If Jan is on a different machine:
1. Open Settings (⚙️)
2. Go to "Advanced" section
3. Update "API URL" to point to your Jan server
4. Example: `http://192.168.1.50:1337/v1`

### Adjusting Generation Settings
1. Open Settings (⚙️)
2. Go to "Generation" section
3. **Temperature**: 
   - 0.0-0.3 = Deterministic (factual, consistent)
   - 0.4-0.7 = Balanced (default, good for most tasks)
   - 0.8+ = Creative (diverse, experimental)
4. **Max Tokens**: Higher = longer responses (slower)
5. **System Prompt**: Controls AI personality

### Markdown & Code Support
The app supports:
- **Headers**: `# Heading 1`, `## Heading 2`, etc.
- **Code blocks**: ````python ... ````
- **Inline code**: `code here`
- **Lists**: `- item` or `1. numbered`
- **Bold/Italic**: `**bold**`, `*italic*`
- **Links**: `[text](url)`
- **Blockquotes**: `> quoted text`

## 6. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Send message |
| `Cmd+Enter` | Send message (Mac) |
| `Esc` | Cancel editing |

## 7. Troubleshooting

### "Disconnected" Status
- Is Jan running? Try: `http://127.0.0.1:1337/v1/models`
- Wrong API URL? Update in Settings > Advanced
- Firewall blocking? Allow localhost/network access

### No models showing up
- Is Jan running with a model loaded?
- Check Jan's console for errors
- Try reloading the page (Ctrl+R or Cmd+R)

### Messages not saving
- Is localStorage enabled in browser settings?
- Private/Incognito mode disables localStorage
- Check browser storage quota

### Slow responses
- Is the model large? (Check context size in settings)
- Is your hardware adequate?
- Try reducing Max Tokens

### Code highlighting not working
- Ensure language is specified: ````python not just ````
- Check supported languages at https://highlightjs.org/static/demo/

## 8. Tips & Best Practices

✅ **DO:**
- Start with lower temperatures for factual tasks
- Use clear, specific prompts for better results
- Save important conversations (export from browser)
- Check token counts if responses seem truncated

❌ **DON'T:**
- Use extremely high temperatures unless experimenting
- Max out Max Tokens (causes slow generation)
- Share sensitive information in prompts
- Use without backing up important conversations

## 9. Environment Info

```
App: Jan Chat UI v1.0.0
Framework: Angular 15
Backend: Jan Server (OpenAI-compatible API)
Browser: Chrome 90+, Firefox 88+, Safari 14+
```

## 10. Need Help?

1. **Check the full features list**: `FEATURES.md`
2. **Common issues**: See Troubleshooting section above
3. **Jan documentation**: Visit https://jan.ai
4. **Verify setup**:
   - Test Jan API: `curl http://127.0.0.1:1337/v1/models`
   - Check localhost access: Open browser DevTools (F12)

## 11. Next Steps

1. ✅ Start chatting with your first message
2. ✅ Try different models if available
3. ✅ Adjust settings for your preferred behavior
4. ✅ Enable LAN Mode to share with others
5. ✅ Explore the markdown and code features

Enjoy your chat UI! 🚀
