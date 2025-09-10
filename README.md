## ⚙️ Configuration# SPA GPT - Saudi Private Aviation Intelligence Platform

A comprehensive React-based web application designed for Saudi Private Aviation, featuring AI-powered invoice processing, document Q&A, and administrative tools.

## 🚀 Features

### Core Modules
- **Invoice Processor**: AI-powered invoice extraction and processing with automated vendor detection
- **General Q&A Assistant**: Interactive AI chatbot for general inquiries
- **Document Q&A**: Upload documents and ask AI questions about their content
- **Dashboard**: Overview of processed invoices and system statistics
- **Admin Panel**: User management and system administration (admin-only)

### Key Capabilities
- **Multi-language Support**: English and Arabic (العربية) with RTL layout
- **Theme System**: Sky and Midnight themes with glassmorphism design
- **User Authentication**: Secure login system with session management
- **Activity Logging**: Comprehensive user action tracking
- **File Upload**: Support for various document formats (PDF, images, etc.)
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Accessibility Features**: High contrast mode, reduced motion options

## 🛠️ Technology Stack

- **Frontend**: React 18+ with TypeScript
- **Styling**: Tailwind CSS with custom themes
- **Icons**: Heroicons (via Tailwind)
- **AI Integration**: Google Gemini API for document processing and Q&A
- **Storage**: LocalStorage for client-side data persistence
- **Authentication**: Cookie-based session management

## 📋 Prerequisites

- Node.js 16.x or higher
- npm or yarn package manager
- Modern web browser with ES2020+ support

## ⚡ Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/spggt.git
   cd spggt
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   REACT_APP_API_ENDPOINT=https://stagefin.spaero.sa/get_bill/spa_gpt_webhook
   REACT_APP_API_TOKEN=your_api_token_here
   ```

4. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🔐 Default Login Credentials

The application includes a mock authentication system with these default users:

- **Admin User**: `admin` / `admin123`
- **Regular User**: `user` / `user123`

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── Header.tsx       # Navigation header
│   ├── ControlPanel.tsx # Invoice processing controls
│   ├── ChatWindow.tsx   # Main chat interface
│   ├── Dashboard.tsx    # Statistics dashboard
│   └── AdminPanel.tsx   # User management
├── services/            # External service integrations
│   ├── geminiService.ts # AI/ML processing
│   └── dbService.ts     # Mock database operations
├── types.ts            # TypeScript type definitions
└── App.tsx            # Main application component
```

## 🎯 Usage Guide

### Invoice Processing
1. Navigate to the Invoice Processor module
2. Upload an invoice document (PDF, JPG, PNG)
3. Use the "extract details" command to process the document
4. Review and modify extracted data
5. Use the "post" command to submit to the API

### Document Q&A
1. Go to the Document Q&A section
2. Upload a document you want to analyze
3. Ask questions about the document content
4. Get AI-powered responses based on the document

### Admin Functions
- User management (create, activate/deactivate, delete users)
- Activity monitoring and logging
- System administration tools

## ⚙️ Configuration

### Theme Customization
The application supports custom themes. Modify the theme configuration in:
- `userSettings.theme`: Switch between 'sky' and 'midnight'
- CSS custom properties in global styles

### Localization
- **Language**: Toggle between English and Arabic
- **Date Format**: Multiple format options (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
- **Timezone**: Default set to Asia/Riyadh

## 🔧 API Integration

The application integrates with the SPA Finance API:
- **Endpoint**: `https://stagefin.spaero.sa/get_bill/spa_gpt_webhook`
- **Method**: POST
- **Authentication**: JWT token-based
- **CORS**: Uses CORS proxy for development

## 🛡️ Security Features

- Session-based authentication with token validation
- Role-based access control (Admin/User roles)
- Activity logging for audit trails
- Secure cookie handling with HttpOnly flags (in production)

## 📱 Mobile Support

The application is fully responsive and supports:
- Touch interactions
- Mobile-optimized layouts
- Progressive Web App features
- Offline functionality (limited)

## 🎨 Design System

### Colors
- **Sky Theme**: Blue-based palette with sky gradients
- **Midnight Theme**: Dark theme with purple accents

### Components
- Glassmorphism cards and modals
- Smooth animations and transitions
- Consistent spacing and typography
- Accessible color contrasts

## 📊 Performance

- Lazy loading for large components
- Optimized bundle splitting
- Efficient state management
- Memory leak prevention

## 🧪 Development

### Available Scripts
- `npm start`: Development server
- `npm build`: Production build
- `npm test`: Run test suite
- `npm run lint`: Code linting

### Code Quality
- TypeScript for type safety
- ESLint for code consistency
- Prettier for code formatting
- Husky for pre-commit hooks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software owned by Saudi Private Aviation. All rights reserved.

## 📞 Support

For technical support or questions:
- **Email**: support@spaero.sa
- **Documentation**: Internal SPA Wiki
- **Issue Tracking**: GitHub Issues

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Setup
Ensure all environment variables are properly configured for production deployment.

### Hosting
The application can be deployed on:
- AWS EC2

---

**Made with for Saudi Private Aviation - Aligned with Vision 2030**