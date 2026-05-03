# LoanLink Server

A comprehensive backend API for the LoanLink microloan management system built with Express.js, Node.js, and MongoDB.

## 🚀 Features

- **User Authentication & Authorization**: JWT-based auth with role-based access control (Admin, Manager, Borrower)
- **Loan Management**: CRUD operations for loans with image uploads
- **Loan Applications**: Complete application workflow with approval/rejection
- **Payment Integration**: Stripe integration for application fee payments
- **File Upload**: Secure image upload handling with Multer
- **Security**: Helmet, CORS, rate limiting, input validation
- **Error Handling**: Comprehensive error handling with custom responses

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens stored in HTTP-only cookies
- **File Upload**: Multer for image handling
- **Payment**: Stripe for payment processing
- **Validation**: Express-validator
- **Security**: Helmet, CORS, bcrypt for password hashing

## 📁 Project Structure

```
loan-link-server/
├── src/
│   ├── config/
│   │   ├── database.js          # MongoDB connection
│   │   └── stripe.js           # Stripe configuration
│   ├── controllers/
│   │   ├── authController.js   # Authentication logic
│   │   ├── userController.js   # User management
│   │   ├── loanController.js   # Loan CRUD operations
│   │   ├── applicationController.js # Application workflow
│   │   └── paymentController.js # Payment processing
│   ├── middleware/
│   │   ├── auth.js             # Authentication middleware
│   │   ├── validation.js       # Input validation
│   │   └── upload.js           # File upload handling
│   ├── models/
│   │   ├── User.js             # User schema
│   │   ├── Loan.js             # Loan schema
│   │   ├── LoanApplication.js  # Application schema
│   │   └── Payment.js          # Payment schema
│   ├── routes/
│   │   ├── auth.js             # Authentication routes
│   │   ├── users.js            # User management routes
│   │   ├── loans.js            # Loan routes
│   │   ├── applications.js     # Application routes
│   │   ├── payments.js         # Payment routes
│   │   └── upload.js           # File upload routes
│   ├── utils/
│   │   ├── jwt.js              # JWT utilities
│   │   └── response.js         # Response helpers
│   └── app.js                  # Express app configuration
├── uploads/                    # Uploaded files storage
├── .env.example               # Environment variables template
├── package.json               # Dependencies and scripts
├── server.js                  # Server entry point
└── README.md                  # Documentation
```

## 🔧 Installation

1. **Clone the repository** (if applicable) or navigate to the project directory

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your actual configuration values.

4. **Start MongoDB** (ensure MongoDB is running on your system)

5. **Start the development server**:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000` by default.

## ⚙️ Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/loanlink

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

## 📚 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - User logout
- `GET /me` - Get current user info

### Users (`/api/users`) - Admin Only
- `GET /` - Get all users (paginated)
- `PUT /:id/role` - Update user role
- `PUT /:id/suspend` - Suspend/unsuspend user

### Loans (`/api/loans`)
- `GET /` - Get all loans (public)
- `GET /home` - Get loans for home page
- `GET /:id` - Get loan details
- `POST /` - Create loan (Manager/Admin)
- `PUT /:id` - Update loan (Manager/Admin)
- `DELETE /:id` - Delete loan (Manager/Admin)

### Applications (`/api/applications`)
- `POST /` - Submit application (Borrower)
- `GET /my` - Get user's applications (Borrower)
- `GET /pending` - Get pending applications (Manager)
- `GET /approved` - Get approved applications (Manager)
- `GET /all` - Get all applications (Admin)
- `PUT /:id/approve` - Approve application (Manager)
- `PUT /:id/reject` - Reject application (Manager)
- `DELETE /:id` - Cancel application (Borrower)

### Payments (`/api/payments`)
- `POST /create-session` - Create Stripe payment session
- `GET /success` - Handle payment success
- `GET /cancel` - Handle payment cancel
- `GET /details/:applicationId` - Get payment details

### Upload (`/api/upload`) - Manager/Admin Only
- `POST /loan-images` - Upload loan images

### Health Check
- `GET /api/health` - Server health status

## 🔐 User Roles & Permissions

### Borrower
- Register and login
- View loans and loan details
- Submit loan applications
- View own applications
- Cancel pending applications
- Make payments for application fees

### Manager (Loan Officer)
- All borrower permissions
- Create and manage loans
- View pending applications
- Approve/reject applications
- Upload loan images

### Admin
- All manager permissions
- Manage users (update roles, suspend/unsuspend)
- View all applications and users
- Access system statistics

## 💳 Payment Integration

The system integrates with Stripe for processing application fees ($10 per application).

### Payment Flow:
1. User submits loan application
2. Application gets approved by manager
3. User can pay the application fee via Stripe checkout
4. Payment status updates automatically
5. User can view payment details

## 📁 File Upload

- **Supported formats**: JPEG, PNG, GIF, WebP
- **Max file size**: 5MB per file
- **Max files**: 5 images per upload
- **Storage**: Local file system in `/uploads` directory

## 🛡️ Security Features

- **JWT Authentication**: HTTP-only cookies for secure token storage
- **Password Hashing**: bcrypt with 12 salt rounds
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Comprehensive validation using express-validator
- **CORS**: Configured for frontend origin
- **Helmet**: Security headers
- **File Upload Security**: File type and size validation

## 🚀 Deployment

1. Set `NODE_ENV=production` in environment variables
2. Ensure MongoDB is accessible
3. Set up Stripe webhook endpoints (optional)
4. Configure proper CORS origins
5. Use a process manager like PM2 for production

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests in watch mode
npm run test:watch
```

## 📝 Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support or questions, please check the API documentation at `/api/docs` or contact the development team.