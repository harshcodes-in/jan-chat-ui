# Jan Chat UI

A modern, production-quality chat UI for the Jan AI server that uses llama.cpp with models like Gemma and Qwen.

## Features

### Core Chat Features
- ✅ **Streaming Responses** - Real-time message streaming
- ✅ **Markdown Rendering** - Full markdown support with proper formatting
- ✅ **Syntax-Highlighted Code Blocks** - Beautiful code highlighting with Copy button
- ✅ **Message Editing** - Edit any message in the conversation
- ✅ **Response Regeneration** - Regenerate AI responses with one click
- ✅ **Stop Generation** - Cancel ongoing message generation
- ✅ **Conversation History** - Full conversation persistence with localStorage
- ✅ **New Chat** - Start fresh conversations anytime

### UI/UX Features
- ✅ **Modern Dark Theme** - Professional dark interface (light theme also available)
- ✅ **Mobile Responsive** - Fully responsive design for phones, tablets, and desktops
- ✅ **Sidebar Navigation** - Easy access to conversation history
- ✅ **Settings Panel** - Comprehensive configuration options
- ✅ **Token Statistics** - View input/output token counts per message
- ✅ **Connection Status** - Real-time connection indicator
- ✅ **Model Information** - Display loaded model details and context length

### Settings & Configuration
- 🎚️ **Temperature Control** - Adjust response creativity (0.0 - 2.0)
- 📏 **Max Tokens** - Set maximum response length (100 - 8000)
- 💬 **System Prompt** - Customize AI behavior with system instructions
- 🌐 **API URL** - Configure Jan server endpoint
- 🖥️ **LAN Mode** - Share the UI across your network with a shareable URL
- 🎨 **Theme Toggle** - Switch between dark and light themes

### Advanced Features
- 💾 **Persistent Conversations** - All chats saved to browser localStorage
- 🤖 **Auto-Fetch Models** - Automatically detects and loads available models
- ⚡ **Model Selection** - Switch between available models mid-conversation
- 🔐 **API Key Support** - Optional bearer token authentication
- 📊 **Message Actions** - Edit, regenerate, and delete messages
- 🎯 **Syntax Highlighting** - Automatic code highlighting for multiple languages
- 📋 **Copy Code** - One-click copy button for code blocks
- 🔄 **Auto-Save** - Conversations auto-save to localStorage
- ⌚ **Timestamped Messages** - Know when each message was sent

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- Jan server running on `http://127.0.0.1:1337/v1`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The application will open at `http://localhost:4200`

### Configuration

#### API Endpoint
By default, the app connects to `http://127.0.0.1:1337/v1`. To change this:
1. Open Settings (⚙️)
2. Go to "Advanced" section
3. Update the API URL

#### LAN Access
To access the UI from another device on your network:
1. Open Settings (⚙️)
2. Go to "Advanced" section
3. Enable "LAN Mode"
4. Copy the displayed URL and share it

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── chat/                 # Main chat component
│   │   ├── message/              # Individual message display
│   │   ├── settings-panel/       # Settings UI
│   │   └── sidebar/              # Navigation sidebar
│   ├── services/
│   │   ├── chat.service.ts       # API communication
│   │   ├── storage.service.ts    # localStorage management
│   │   └── markdown.service.ts   # Markdown & syntax highlighting
│   ├── app.component.*
│   └── app.module.ts
├── styles.css                    # Global styles
└── index.html
```

## Key Technologies

- **Angular 15** - Frontend framework
- **TypeScript** - Type-safe development
- **marked** - Markdown parsing
- **highlight.js** - Syntax highlighting
- **localStorage API** - Persistent storage
- **RxJS** - Reactive programming

## API Integration

The application uses the OpenAI-compatible API provided by Jan:

### Endpoints Used
- `GET /v1/models` - Fetch available models
- `POST /v1/chat/completions` - Send chat messages

### Message Format
```typescript
{
  model: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  temperature: number;
  max_tokens: number;
  stream: boolean;
}
```

## Customization

### Styling
- Global styles: `src/styles.css`
- Component styles: `src/app/components/*/component.css`
- Dark theme colors use Tailwind-like palette
- CSS variables can be customized

### Theme Colors
Main color scheme uses:
- Blue: `#3b82f6` (primary)
- Green: `#10b981` (success)
- Red: `#ef4444` (error)
- Gray: `#1e293b` (backgrounds)

### Extending Features
1. **Add new components**: Use Angular CLI: `ng generate component components/my-component`
2. **Add services**: `ng generate service services/my-service`
3. **Update settings**: Extend `AppSettings` interface in `storage.service.ts`

## Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance
- Initial bundle: ~4.4 MB (includes all dependencies)
- Optimized CSS and JavaScript
- Lazy component loading
- Efficient message rendering with Angular trackBy

## Troubleshooting

### Can't connect to Jan server
1. Ensure Jan is running on `http://127.0.0.1:1337/v1`
2. Check the connection status indicator in the sidebar
3. Update the API URL in Settings > Advanced

### Messages not saving
1. Check browser localStorage is enabled
2. Clear browser cache and try again
3. Open DevTools console for error messages

### Syntax highlighting not working
1. Verify highlight.js is loaded (check Network tab)
2. Ensure code block has a language identifier: ` ```python`

### UI scaling issues on mobile
1. Check browser zoom level (should be 100%)
2. Rotate device to landscape for better layout
3. Update browser to latest version

## Future Enhancements
- [ ] Image upload support
- [ ] Voice input/output
- [ ] Export conversations (PDF, Markdown)
- [ ] Conversation search and filtering
- [ ] Message reactions and feedback
- [ ] Collaborative conversations
- [ ] Custom prompt templates
- [ ] Model comparison side-by-side

## Building for Production

```bash
npm run build
```

Outputs to `dist/jan-chat-ui/` - ready to deploy.

### Deployment Options
- **Static hosting**: Netlify, Vercel, GitHub Pages
- **Docker**: Create `Dockerfile` for containerized deployment
- **Direct server**: Copy `dist` contents to your web server

## Development

### Development server
```bash
npm start
# or
ng serve
```

### Running tests
```bash
npm test
```

### Build
```bash
npm run build
```

### Watch mode
```bash
npm run watch
```

## License
MIT

## Support
For issues or questions:
1. Check the troubleshooting section
2. Review browser console for errors
3. Verify Jan server is running and accessible
4. Check network requests in DevTools

## Version
Current: 1.0.0

Last Updated: 2026-08-15
