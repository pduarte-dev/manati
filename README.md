# Manati - Collaborative Markdown Editor

A modern, web-based collaborative markdown editor with real-time preview, file management, and Git integration.

## Features

- **Multi-mode Editing**: Switch between Markdown source, visual WYSIWYG, and live preview modes
- **Collaborative Editing**: File locking system prevents conflicts when multiple users edit simultaneously
- **Git Integration**: Automatic version control with commit tracking and change management
- **File Management**: Complete file and folder operations with drag-and-drop support
- **Authentication**: GitHub OAuth integration for secure access control
- **Theme Support**: Light and dark themes for comfortable editing
- **File Upload**: Support for images and documents with automatic linking
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Technology Stack

### Backend
- **Runtime**: Node.js with Express framework
- **Language**: TypeScript for type safety and better development experience
- **Authentication**: Passport.js with GitHub OAuth strategy
- **File Operations**: Native Node.js filesystem APIs
- **Git Integration**: Native Git commands via child_process
- **Session Management**: Express sessions for user state

### Frontend
- **Architecture**: Modular ES6 JavaScript with dynamic imports
- **Styling**: Bootstrap 5 for responsive UI components
- **Icons**: Bootstrap Icons for consistent iconography
- **Markdown Processing**: Marked.js for markdown parsing and rendering
- **File Upload**: Multer for handling multipart/form-data

## Installation

### Prerequisites
- Node.js 16.x or higher
- npm or yarn package manager
- Git (for version control features)

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd manati
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Server configuration
PORT=3000
NODE_ENV=development

# Directory paths (customize for your project)
MARKDOWN_ROOT_DIR=./markdown-files
UPLOADS_DIR=./uploads

# Logging
LOG_DEBUG=true

# Authentication (optional)
AUTH_ENABLED=true
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
ALLOWED_EMAIL_DOMAIN=@yourdomain.com
SESSION_SECRET=your-secure-session-secret

# Git integration (optional)
GIT_TARGET_BRANCH=main
GIT_REMOTE_URL=https://github.com/username/repository.git
```

4. Build the application:
```bash
npm run build
```

5. Start the server:
```bash
npm start
```

6. Access the application at `http://localhost:3000`

## Configuration

### Directory Structure

Manati uses configurable directories for content and uploads:

- **MARKDOWN_ROOT_DIR**: Where your markdown files are stored
- **UPLOADS_DIR**: Where uploaded files (images, documents) are saved

These can be absolute or relative paths, allowing integration with existing projects like Docusaurus, GitBook, or static site generators.

### GitHub OAuth Setup

For authentication features:

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set the authorization callback URL to: `http://localhost:3000/auth/github/callback`
4. Add the Client ID and Secret to your `.env` file

### Git Integration

The editor automatically detects Git repositories and provides:
- Automatic staging of modified files
- Commit creation with user attribution
- Change tracking per user session
- Support for custom target branches

## Usage

### Basic Operations

- **Create Files**: Click "New File" in the toolbar or right-click in the file explorer
- **Create Folders**: Click "New Folder" or use the right-click context menu
- **Edit Files**: Double-click any markdown file to open in the editor
- **Switch Modes**: Use the tabs (Markdown, Visual, Preview) to change editing modes
- **Save Changes**: Ctrl+S or click the "Save" button
- **Upload Files**: Drag and drop or use the upload buttons in the toolbar

### Collaborative Features

- **File Locking**: Files are automatically locked when opened by a user
- **Real-time Status**: See which files are being edited by others
- **Git Integration**: Track changes and publish commits when ready

### Keyboard Shortcuts

- `Ctrl+S` - Save current file
- `Ctrl+N` - Create new file
- `Ctrl+Shift+N` - Create new folder
- `Ctrl+B` - Bold text (visual editor)
- `Ctrl+I` - Italic text (visual editor)
- `Ctrl+U` - Underline text (visual editor)

## API Reference

### File Operations

- `GET /api/files` - List files and directories
- `GET /api/file/:path` - Read file content
- `POST /api/file/:path` - Save file content
- `DELETE /api/file/:path` - Delete file
- `POST /api/folder` - Create directory
- `PUT /api/rename` - Rename file or folder

### Upload Operations

- `POST /api/upload` - Upload single file
- `POST /api/upload-multiple` - Upload multiple files

### Git Operations

- `GET /api/git/status` - Get repository status
- `GET /api/git/config` - Get Git configuration
- `POST /api/git/commit` - Create commit with changes

### Authentication

- `GET /auth/github` - Initiate GitHub OAuth
- `GET /auth/github/callback` - OAuth callback
- `POST /auth/logout` - Logout user
- `GET /auth/user` - Get current user info

## Development

### Project Structure

```
manati/
├── src/                    # TypeScript backend source
│   ├── config/            # Configuration management
│   ├── routes/            # Express route handlers
│   ├── services/          # Business logic services
│   ├── utils/             # Utility functions
│   └── types/             # TypeScript type definitions
├── public/                # Frontend static files
│   ├── js/modules/        # Modular JavaScript components
│   ├── css/               # Stylesheets
│   ├── components/        # HTML components
│   └── assets/            # Images and static assets
├── dist/                  # Compiled TypeScript output
└── docs/                  # Documentation files
```

### Development Scripts

- `npm run dev` - Start development server with auto-restart
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run test` - Run test suite (if available)

### Adding New Features

1. **Backend**: Add routes in `src/routes/`, implement logic in `src/services/`
2. **Frontend**: Create modules in `public/js/modules/`, add UI in `public/components/`
3. **Styling**: Extend styles in `public/css/` following Bootstrap conventions

## Integration with Static Site Generators

### Docusaurus

```env
MARKDOWN_ROOT_DIR=./docusaurus/docs
UPLOADS_DIR=./docusaurus/static/img
```

### GitBook

```env
MARKDOWN_ROOT_DIR=./gitbook
UPLOADS_DIR=./gitbook/.gitbook/assets
```

### Jekyll

```env
MARKDOWN_ROOT_DIR=./_posts
UPLOADS_DIR=./assets/images
```

## Security Considerations

- Always use HTTPS in production
- Configure proper session secrets
- Restrict file access to authorized users
- Validate file uploads and paths
- Use environment variables for sensitive configuration
- Enable authentication for production deployments

## Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository** and create a feature branch
2. **Write tests** for new functionality when applicable
3. **Follow code style** conventions used in the project
4. **Update documentation** for any API or configuration changes
5. **Submit a pull request** with a clear description of changes

### Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Create a feature branch: `git checkout -b feature/amazing-feature`
4. Make your changes and test thoroughly
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Report bugs or request features via GitHub Issues
- **Discussions**: Join community discussions for questions and ideas

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes and releases.

---

**Manati** - Making markdown editing collaborative and enjoyable.
