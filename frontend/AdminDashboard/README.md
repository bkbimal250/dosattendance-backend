# Employee Attendance System - Frontend

A modern, responsive React application for managing employee attendance, leaves, documents, and team communication with JWT authentication.

## 🚀 Features

### 🔐 Authentication & Security
- **JWT Authentication** with access and refresh tokens
- **Automatic token refresh** for seamless user experience
- **Role-based access control** (Admin, Manager, Employee)
- **Secure password management** with change password functionality
- **Protected routes** with automatic redirection

### 📊 Dashboard & Analytics
- **Admin Dashboard** with comprehensive statistics and quick actions
- **User Dashboard** with personalized attendance and leave information
- **Real-time data visualization** with charts and graphs
- **Performance metrics** and attendance tracking
- **Department-wise analytics**

### 👥 User Management
- **Complete CRUD operations** for user management
- **Role assignment** (Admin, Manager, Employee)
- **Department management**
- **User profile management** with avatar upload
- **Bulk user operations**

### ⏰ Attendance Management
- **Clock in/out functionality**
- **Attendance tracking** with timestamps
- **Late arrival detection**
- **Attendance reports** and analytics
- **Monthly attendance trends**

### 📅 Leave Management
- **Leave request submission**
- **Leave approval workflow**
- **Leave type management** (Sick, Annual, Personal, etc.)
- **Leave balance tracking**
- **Leave calendar view**

### 📄 Document Management
- **Document upload and sharing**
- **Document categorization**
- **Access control** for documents
- **Document versioning**
- **Search and filter functionality**

### 💬 Team Communication
- **Real-time chat system**
- **Group chat rooms**
- **Direct messaging**
- **File sharing in chat**
- **Message history**

### 🔔 Notifications
- **Real-time notifications**
- **Email notifications**
- **Push notifications**
- **Notification preferences**
- **Notification history**

### 📈 Reports & Analytics
- **Comprehensive reporting system**
- **Multiple report types** (Attendance, Leave, Performance, Department)
- **Export functionality** (PDF, Excel, CSV)
- **Custom date ranges**
- **Department-wise filtering**

### ⚙️ Settings & Configuration
- **User profile settings**
- **System preferences**
- **Theme customization**
- **Language settings**
- **Notification preferences**

## 🛠️ Tech Stack

### Frontend Framework
- **React 19** - Latest React with hooks and modern features
- **Vite** - Fast build tool and development server
- **React Router v7** - Client-side routing

### Styling & UI
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **Headless UI** - Accessible UI components
- **Custom Design System** - Consistent component library

### State Management
- **React Context API** - Global state management
- **Custom Hooks** - Reusable logic
- **Local Storage** - Persistent data storage

### HTTP Client
- **Axios** - HTTP client with interceptors
- **JWT Authentication** - Secure API communication
- **Automatic token refresh** - Seamless user experience

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## 📁 Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── assets/            # Images, fonts, etc.
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # Base UI components
│   │   ├── layout/       # Layout components
│   │   ├── dashboard/    # Dashboard-specific components
│   │   └── icons/        # Custom icons
│   ├── contexts/         # React contexts
│   ├── pages/            # Page components
│   │   ├── dashboard/    # Dashboard pages
│   │   └── ...          # Other pages
│   ├── services/         # API services
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # App entry point
│   └── index.css        # Global styles
├── package.json          # Dependencies and scripts
├── tailwind.config.cjs   # Tailwind configuration
├── postcss.config.cjs    # PostCSS configuration
├── vite.config.js        # Vite configuration
└── README.md            # This file
```

## 🎨 Design System

### Color Palette
- **Primary**: Blue shades (#3b82f6 to #1e3a8a)
- **Secondary**: Gray shades (#f8fafc to #020617)
- **Success**: Green shades (#22c55e to #052e16)
- **Warning**: Yellow shades (#f59e0b to #451a03)
- **Danger**: Red shades (#ef4444 to #450a0a)
- **Info**: Cyan shades (#06b6d4 to #083344)

### Typography
- **Font Family**: Inter (Google Fonts)
- **Font Weights**: 300, 400, 500, 600, 700
- **Responsive**: Mobile-first design

### Components
- **Buttons**: Primary, secondary, danger variants
- **Cards**: Content containers with shadows
- **Inputs**: Form inputs with validation states
- **Badges**: Status indicators
- **Modals**: Overlay dialogs
- **Tables**: Data display with sorting

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Backend API** running on `http://localhost:8000`

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5174
   ```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=Employee Attendance System
```

### API Configuration
The application is configured to work with the Django backend API. Ensure the backend is running and accessible at the configured URL.

## 📱 Responsive Design

The application is fully responsive and works on:
- **Desktop** (1024px and above)
- **Tablet** (768px to 1023px)
- **Mobile** (320px to 767px)

## 🔐 Authentication Flow

1. **Login**: User enters credentials
2. **JWT Tokens**: Backend returns access and refresh tokens
3. **Token Storage**: Tokens stored in localStorage
4. **API Requests**: Access token automatically included in headers
5. **Token Refresh**: Automatic refresh when access token expires
6. **Logout**: Tokens cleared and user redirected to login

## 🎯 Key Features Implementation

### JWT Authentication Service
- **Automatic token management**
- **Request/response interceptors**
- **Error handling and retry logic**
- **Token expiration detection**

### Role-Based Access Control
- **Admin**: Full system access
- **Manager**: Department management
- **Employee**: Personal data and basic features

### Real-Time Features
- **Live notifications**
- **Real-time chat**
- **Attendance updates**
- **Status indicators**

## 🧪 Testing

### Manual Testing
1. **Login/Logout**: Test authentication flow
2. **Navigation**: Test all routes and menus
3. **Forms**: Test form validation and submission
4. **Responsive**: Test on different screen sizes
5. **Permissions**: Test role-based access

### Browser Compatibility
- **Chrome** (recommended)
- **Firefox**
- **Safari**
- **Edge**

## 🚀 Deployment

### Build Process
```bash
npm run build
```

### Deployment Options
- **Vercel**: Zero-config deployment
- **Netlify**: Drag and drop deployment
- **AWS S3**: Static website hosting
- **Docker**: Containerized deployment

### Environment Setup
1. Set production API URL
2. Configure CORS settings
3. Set up SSL certificates
4. Configure CDN (optional)

## 📊 Performance

### Optimization Features
- **Code splitting** with React.lazy()
- **Image optimization** with Vite
- **Tree shaking** for unused code removal
- **Minification** for production builds
- **Caching** strategies

### Performance Metrics
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

## 🔧 Development

### Code Style
- **ESLint** configuration
- **Prettier** formatting
- **Conventional commits**
- **Component documentation**

### Git Workflow
1. Create feature branch
2. Make changes
3. Test thoroughly
4. Create pull request
5. Code review
6. Merge to main

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/token/` - Login
- `POST /api/token/refresh/` - Refresh token
- `POST /api/token/verify/` - Verify token

### User Management
- `GET /api/users/` - Get all users
- `POST /api/users/` - Create user
- `PUT /api/users/{id}/` - Update user
- `DELETE /api/users/{id}/` - Delete user

### Attendance
- `GET /api/attendance/` - Get attendance records
- `POST /api/attendance/clock_in/` - Clock in
- `POST /api/attendance/clock_out/` - Clock out

### Leaves
- `GET /api/leaves/` - Get leave requests
- `POST /api/leaves/` - Submit leave request
- `PUT /api/leaves/{id}/` - Update leave request

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Updates

### Version History
- **v1.0.0**: Initial release with basic features
- **v1.1.0**: Added JWT authentication
- **v1.2.0**: Added reports and analytics
- **v1.3.0**: Enhanced UI/UX and performance

### Roadmap
- [ ] Real-time notifications
- [ ] Mobile app
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Dark mode theme

---

**Built with ❤️ using React, Tailwind CSS, and JWT Authentication**
#   A d m i n D a s h b o a r d  
 