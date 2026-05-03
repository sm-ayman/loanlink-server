# LoanLink Backend Architecture & API Documentation

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Authentication & Authorization](#authentication--authorization)
7. [Middleware Flow](#middleware-flow)
8. [Error Handling](#error-handling)
9. [Security Features](#security-features)

---

## Architecture Overview

LoanLink is a RESTful API backend built with Express.js following the MVC (Model-View-Controller) architecture pattern. The system supports three user roles: **Admin**, **Manager** (Loan Officer), and **Borrower**.

### Key Components:
- **Models**: Mongoose schemas defining data structure
- **Controllers**: Business logic and request handling
- **Routes**: API endpoint definitions
- **Middleware**: Authentication, validation, and error handling
- **Utils**: Reusable helper functions

### Request Flow:
```
Client Request → Middleware (Auth/Validation) → Controller → Model → Database
                                                      ↓
                                              Response ← JSON
```

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js |
| Framework | Express.js 4.18.2 |
| Database | MongoDB with Mongoose 8.0.3 |
| Authentication | JWT (jsonwebtoken) |
| Password Hashing | bcryptjs |
| File Upload | Multer |
| Payment Processing | Stripe |
| Validation | express-validator |
| Security | Helmet, CORS, Rate Limiting |
| Environment | dotenv |

---

## Project Structure

```
loan-link-server/
├── src/
│   ├── config/
│   │   ├── database.js          # MongoDB connection configuration
│   │   └── stripe.js            # Stripe API configuration
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── userController.js    # User management
│   │   ├── loanController.js    # Loan CRUD operations
│   │   ├── applicationController.js # Application workflow
│   │   └── paymentController.js # Payment processing
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication & authorization
│   │   ├── validation.js        # Input validation rules
│   │   └── upload.js            # File upload handling
│   ├── models/
│   │   ├── User.js              # User schema
│   │   ├── Loan.js              # Loan schema
│   │   ├── LoanApplication.js   # Application schema
│   │   └── Payment.js           # Payment schema
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── users.js             # User management routes
│   │   ├── loans.js             # Loan routes
│   │   ├── applications.js      # Application routes
│   │   ├── payments.js          # Payment routes
│   │   └── upload.js            # File upload routes
│   ├── utils/
│   │   ├── jwt.js               # JWT utility functions
│   │   └── response.js          # Response helper functions
│   └── app.js                   # Express app configuration
├── uploads/                     # Uploaded files storage
├── .env                         # Environment variables
├── .env.example                 # Environment template
├── package.json                 # Dependencies
├── server.js                    # Server entry point
└── README.md                    # Project documentation
```

---

## Database Schema

### 1. User Model
```javascript
{
  name: String (required, 2-50 chars),
  email: String (required, unique, lowercase),
  password: String (required, hashed, min 6 chars),
  photoURL: String (optional),
  role: String (enum: ['borrower', 'manager', 'admin'], default: 'borrower'),
  isSuspended: Boolean (default: false),
  suspendReason: String,
  suspendFeedback: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `email` (unique)
- `role`

### 2. Loan Model
```javascript
{
  title: String (required, 3-100 chars),
  description: String (required, 10-1000 chars),
  category: String (enum: ['personal', 'business', 'education', 'home', 'vehicle', 'emergency', 'other']),
  interestRate: Number (required, 0-50),
  maxLoanLimit: Number (required, 100-1000000),
  requiredDocuments: [String],
  emiPlans: [String],
  images: [String], // file paths
  createdBy: ObjectId (ref: User, required),
  showOnHome: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `category`
- `showOnHome`
- `createdBy`
- `interestRate`

### 3. LoanApplication Model
```javascript
{
  userId: ObjectId (ref: User, required),
  loanId: ObjectId (ref: Loan, required),
  firstName: String (required, 2-50 chars),
  lastName: String (required, 2-50 chars),
  contactNumber: String (required),
  nationalId: String (required, unique),
  incomeSource: String (enum: ['salary', 'business', 'freelance', 'investment', 'rental', 'other']),
  monthlyIncome: Number (required, 0-1000000),
  loanAmount: Number (required, 100-1000000),
  reasonForLoan: String (required, 10-500 chars),
  address: String (required, 10-200 chars),
  extraNotes: String (optional, max 500 chars),
  status: String (enum: ['pending', 'approved', 'rejected'], default: 'pending'),
  applicationFeeStatus: String (enum: ['paid', 'unpaid'], default: 'unpaid'),
  approvedAt: Date,
  rejectedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `userId`
- `loanId`
- `status`
- `applicationFeeStatus`
- `createdAt` (descending)
- Compound: `userId + status`
- Compound: `status + createdAt`

### 4. Payment Model
```javascript
{
  loanApplicationId: ObjectId (ref: LoanApplication, required),
  userId: ObjectId (ref: User, required),
  amount: Number (required, default: 10),
  transactionId: String (required, unique),
  paymentStatus: String (enum: ['success', 'failed', 'pending'], default: 'pending'),
  email: String (required),
  createdAt: Date
}
```

**Indexes:**
- `loanApplicationId`
- `userId`
- `transactionId` (unique)
- `paymentStatus`
- `createdAt` (descending)

---

## API Endpoints

### Base URL
```
http://localhost:5000/api
```

### Response Format
All responses follow this structure:
```json
{
  "success": true/false,
  "message": "Response message",
  "data": { /* response data */ },
  "errors": [ /* validation errors if any */ ]
}
```

---

## Authentication Routes (`/api/auth`)

### 1. Register User
**POST** `/api/auth/register`

**Description:** Register a new user account

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123",
  "role": "borrower",
  "photoURL": "https://example.com/photo.jpg"
}
```

**Validation Rules:**
- Name: 2-50 characters, letters and spaces only
- Email: Valid email format
- Password: Min 6 characters, must contain uppercase and lowercase
- Role: Optional, must be 'borrower', 'manager', or 'admin'

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "borrower",
      "photoURL": "https://example.com/photo.jpg"
    },
    "token": "jwt_token_here"
  }
}
```

**Error Responses:**
- `400`: Validation error
- `400`: Email already exists
- `500`: Server error

---

### 2. Login
**POST** `/api/auth/login`

**Description:** Authenticate user and return JWT token

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "borrower",
      "photoURL": "https://example.com/photo.jpg"
    },
    "token": "jwt_token_here"
  }
}
```

**Error Responses:**
- `401`: Invalid email or password
- `403`: Account suspended
- `500`: Server error

**Note:** Token is stored in HTTP-only cookie named `token`

---

### 3. Logout
**POST** `/api/auth/logout`

**Description:** Logout user and clear authentication token

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### 4. Get Current User
**GET** `/api/auth/me`

**Description:** Get authenticated user's information

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "borrower",
      "photoURL": "https://example.com/photo.jpg",
      "isSuspended": false
    }
  }
}
```

---

### 5. Google OAuth Login (Placeholder)
**POST** `/api/auth/google-login`

**Description:** Google OAuth authentication (Not implemented yet)

**Response (501):**
```json
{
  "success": false,
  "message": "Google OAuth not implemented yet"
}
```

---

## User Management Routes (`/api/users`) - Admin Only

### 1. Get All Users
**GET** `/api/users`

**Description:** Get paginated list of all users

**Authentication:** Required (Admin only)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `role` (optional): Filter by role
- `search` (optional): Search by name or email

**Example:** `/api/users?page=1&limit=10&role=borrower&search=john`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "borrower",
        "isSuspended": false,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### 2. Update User Role
**PUT** `/api/users/:id/role`

**Description:** Update user role or suspension status

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "role": "manager",
  "isSuspended": false,
  "suspendReason": "Violation of terms",
  "suspendFeedback": "Account suspended due to policy violation"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "manager",
      "isSuspended": false
    }
  }
}
```

---

### 3. Suspend User
**PUT** `/api/users/:id/suspend`

**Description:** Suspend or unsuspend a user account

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "isSuspended": true,
  "suspendReason": "Policy violation",
  "suspendFeedback": "Account suspended for 30 days"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user": {
      "id": "user_id",
      "isSuspended": true,
      "suspendReason": "Policy violation",
      "suspendFeedback": "Account suspended for 30 days"
    }
  }
}
```

---

### 4. Delete User
**DELETE** `/api/users/:id`

**Description:** Soft delete user (suspends account)

**Authentication:** Required (Admin only)

**Response (200):**
```json
{
  "success": true,
  "message": "User account suspended successfully"
}
```

---

### 5. Get User Statistics
**GET** `/api/users/stats`

**Description:** Get user statistics for admin dashboard

**Authentication:** Required (Admin only)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "roleBreakdown": {
      "borrowers": 120,
      "managers": 25,
      "admins": 5
    },
    "suspendedUsers": 3,
    "recentRegistrations": 15
  }
}
```

---

## Loan Routes (`/api/loans`)

### 1. Get All Loans
**GET** `/api/loans`

**Description:** Get paginated list of all loans (public route)

**Authentication:** Optional

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 12)
- `category` (optional): Filter by category
- `minInterest` (optional): Minimum interest rate
- `maxInterest` (optional): Maximum interest rate
- `minLimit` (optional): Minimum loan limit
- `maxLimit` (optional): Maximum loan limit
- `search` (optional): Search by title, description, or category

**Example:** `/api/loans?category=personal&minInterest=5&maxInterest=15&page=1&limit=12`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "loans": [
      {
        "id": "loan_id",
        "title": "Personal Loan",
        "description": "Quick personal loan for urgent needs",
        "category": "personal",
        "interestRate": 10.5,
        "maxLoanLimit": 50000,
        "images": ["image1.jpg", "image2.jpg"],
        "createdBy": {
          "id": "user_id",
          "name": "Manager Name"
        },
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalLoans": 60,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### 2. Get Home Page Loans
**GET** `/api/loans/home`

**Description:** Get loans marked to show on home page (limited to 6)

**Authentication:** Not required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "loans": [
      {
        "id": "loan_id",
        "title": "Personal Loan",
        "description": "Quick personal loan",
        "category": "personal",
        "interestRate": 10.5,
        "maxLoanLimit": 50000,
        "images": ["image1.jpg"]
      }
    ]
  }
}
```

---

### 3. Get Loan by ID
**GET** `/api/loans/:id`

**Description:** Get detailed information about a specific loan

**Authentication:** Optional

**Response (200):**
```json
{
  "success": true,
  "data": {
    "loan": {
      "id": "loan_id",
      "title": "Personal Loan",
      "description": "Detailed description here",
      "category": "personal",
      "interestRate": 10.5,
      "maxLoanLimit": 50000,
      "requiredDocuments": ["ID Proof", "Income Certificate"],
      "emiPlans": ["6 months", "12 months", "24 months"],
      "images": ["image1.jpg", "image2.jpg"],
      "createdBy": {
        "id": "user_id",
        "name": "Manager Name",
        "email": "manager@example.com"
      },
      "showOnHome": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `404`: Loan not found
- `400`: Invalid loan ID

---

### 4. Create Loan
**POST** `/api/loans`

**Description:** Create a new loan (Manager/Admin only)

**Authentication:** Required (Manager/Admin)

**Request Body (multipart/form-data):**
```
title: "Personal Loan"
description: "Quick personal loan for urgent needs"
category: "personal"
interestRate: 10.5
maxLoanLimit: 50000
requiredDocuments: ["ID Proof", "Income Certificate"]
emiPlans: ["6 months", "12 months"]
showOnHome: true
images: [file1, file2, ...] (max 5 files, 5MB each)
```

**Response (201):**
```json
{
  "success": true,
  "message": "Loan created successfully",
  "data": {
    "loan": {
      "id": "loan_id",
      "title": "Personal Loan",
      "description": "Quick personal loan",
      "category": "personal",
      "interestRate": 10.5,
      "maxLoanLimit": 50000,
      "images": ["image1.jpg", "image2.jpg"],
      "createdBy": {
        "id": "user_id",
        "name": "Manager Name"
      }
    }
  }
}
```

**Error Responses:**
- `400`: Validation error
- `401`: Unauthorized
- `403`: Forbidden (not manager/admin)
- `500`: Server error

---

### 5. Update Loan
**PUT** `/api/loans/:id`

**Description:** Update an existing loan (Manager/Admin only, creator or admin)

**Authentication:** Required (Manager/Admin)

**Request Body (multipart/form-data):**
```
title: "Updated Personal Loan"
description: "Updated description"
category: "personal"
interestRate: 12.0
maxLoanLimit: 60000
images: [new_file1, new_file2] (optional, replaces old images)
showOnHome: false
```

**Response (200):**
```json
{
  "success": true,
  "message": "Loan updated successfully",
  "data": {
    "loan": {
      "id": "loan_id",
      "title": "Updated Personal Loan",
      "description": "Updated description",
      "interestRate": 12.0,
      "maxLoanLimit": 60000
    }
  }
}
```

**Error Responses:**
- `403`: You can only update loans you created
- `404`: Loan not found

---

### 6. Delete Loan
**DELETE** `/api/loans/:id`

**Description:** Delete a loan (Manager/Admin only, creator or admin)

**Authentication:** Required (Manager/Admin)

**Response (200):**
```json
{
  "success": true,
  "message": "Loan deleted successfully"
}
```

**Error Responses:**
- `403`: You can only delete loans you created
- `404`: Loan not found

---

### 7. Get My Loans (Manager)
**GET** `/api/loans/my/loans`

**Description:** Get all loans created by the current manager

**Authentication:** Required (Manager only)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "loans": [
      {
        "id": "loan_id",
        "title": "Personal Loan",
        "category": "personal",
        "interestRate": 10.5,
        "maxLoanLimit": 50000,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

## Loan Application Routes (`/api/applications`)

### 1. Submit Application
**POST** `/api/applications`

**Description:** Submit a new loan application (Borrower only)

**Authentication:** Required (Borrower)

**Request Body:**
```json
{
  "loanId": "loan_id",
  "firstName": "John",
  "lastName": "Doe",
  "contactNumber": "+1234567890",
  "nationalId": "ID123456789",
  "incomeSource": "salary",
  "monthlyIncome": 5000,
  "loanAmount": 10000,
  "reasonForLoan": "Need funds for home renovation",
  "address": "123 Main St, City, State, ZIP",
  "extraNotes": "Additional information if needed"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Loan application submitted successfully",
  "data": {
    "application": {
      "id": "application_id",
      "loanId": {
        "id": "loan_id",
        "title": "Personal Loan",
        "category": "personal"
      },
      "userId": {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "status": "pending",
      "applicationFeeStatus": "unpaid",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `400`: Validation error
- `400`: Loan amount exceeds maximum limit
- `400`: Already have pending/approved application for this loan
- `404`: Loan not found

---

### 2. Get My Applications
**GET** `/api/applications/my`

**Description:** Get all applications submitted by the current borrower

**Authentication:** Required (Borrower)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "application_id",
        "loanId": {
          "id": "loan_id",
          "title": "Personal Loan",
          "category": "personal",
          "interestRate": 10.5,
          "maxLoanLimit": 50000
        },
        "loanAmount": 10000,
        "status": "pending",
        "applicationFeeStatus": "unpaid",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### 3. Get Pending Applications
**GET** `/api/applications/pending`

**Description:** Get all pending applications (Manager only)

**Authentication:** Required (Manager)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "application_id",
        "userId": {
          "id": "user_id",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "loanId": {
          "id": "loan_id",
          "title": "Personal Loan",
          "category": "personal"
        },
        "loanAmount": 10000,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalApplications": 25,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### 4. Get Approved Applications
**GET** `/api/applications/approved`

**Description:** Get all approved applications (Manager only)

**Authentication:** Required (Manager)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "application_id",
        "userId": {
          "id": "user_id",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "loanId": {
          "id": "loan_id",
          "title": "Personal Loan",
          "category": "personal"
        },
        "loanAmount": 10000,
        "approvedAt": "2024-01-02T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalApplications": 15,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### 5. Get All Applications
**GET** `/api/applications/all`

**Description:** Get all applications with filters (Admin only)

**Authentication:** Required (Admin)

**Query Parameters:**
- `status` (optional): Filter by status (pending/approved/rejected)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "application_id",
        "userId": {
          "id": "user_id",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "loanId": {
          "id": "loan_id",
          "title": "Personal Loan",
          "category": "personal"
        },
        "status": "approved",
        "loanAmount": 10000,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalApplications": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### 6. Approve Application
**PUT** `/api/applications/:id/approve`

**Description:** Approve a pending loan application (Manager only)

**Authentication:** Required (Manager)

**Response (200):**
```json
{
  "success": true,
  "message": "Application approved successfully",
  "data": {
    "application": {
      "id": "application_id",
      "status": "approved",
      "approvedAt": "2024-01-02T00:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `400`: Application is not in pending status
- `404`: Application not found

---

### 7. Reject Application
**PUT** `/api/applications/:id/reject`

**Description:** Reject a pending loan application (Manager only)

**Authentication:** Required (Manager)

**Response (200):**
```json
{
  "success": true,
  "message": "Application rejected successfully",
  "data": {
    "application": {
      "id": "application_id",
      "status": "rejected",
      "rejectedAt": "2024-01-02T00:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `400`: Application is not in pending status
- `404`: Application not found

---

### 8. Cancel Application
**DELETE** `/api/applications/:id`

**Description:** Cancel own pending application (Borrower only)

**Authentication:** Required (Borrower)

**Response (200):**
```json
{
  "success": true,
  "message": "Application cancelled successfully"
}
```

**Error Responses:**
- `400`: Only pending applications can be cancelled
- `403`: You can only cancel your own applications
- `404`: Application not found

---

### 9. Get Application Details
**GET** `/api/applications/:id`

**Description:** Get detailed information about an application (Borrower/Manager/Admin)

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "application": {
      "id": "application_id",
      "userId": {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "loanId": {
        "id": "loan_id",
        "title": "Personal Loan",
        "description": "Loan description",
        "category": "personal",
        "interestRate": 10.5,
        "maxLoanLimit": 50000
      },
      "firstName": "John",
      "lastName": "Doe",
      "contactNumber": "+1234567890",
      "nationalId": "ID123456789",
      "incomeSource": "salary",
      "monthlyIncome": 5000,
      "loanAmount": 10000,
      "reasonForLoan": "Need funds for home renovation",
      "address": "123 Main St, City, State, ZIP",
      "extraNotes": "Additional information",
      "status": "approved",
      "applicationFeeStatus": "paid",
      "approvedAt": "2024-01-02T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

## Payment Routes (`/api/payments`)

### 1. Create Payment Session
**POST** `/api/payments/create-session`

**Description:** Create Stripe checkout session for application fee ($10)

**Authentication:** Required (Borrower)

**Request Body:**
```json
{
  "applicationId": "application_id"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment session created successfully",
  "data": {
    "sessionId": "cs_test_...",
    "url": "https://checkout.stripe.com/pay/cs_test_..."
  }
}
```

**Error Responses:**
- `400`: Application must be approved before payment
- `400`: Application fee already paid
- `403`: You can only pay for your own applications
- `404`: Application not found

---

### 2. Payment Success Handler
**GET** `/api/payments/success`

**Description:** Handle successful payment callback

**Authentication:** Required

**Query Parameters:**
- `session_id`: Stripe session ID

**Response (200):**
```json
{
  "success": true,
  "message": "Payment completed successfully",
  "data": {
    "payment": {
      "id": "payment_id",
      "amount": 10,
      "transactionId": "cs_test_...",
      "paymentStatus": "success"
    }
  }
}
```

---

### 3. Payment Cancel Handler
**GET** `/api/payments/cancel`

**Description:** Handle cancelled payment

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "message": "Payment cancelled"
}
```

---

### 4. Get Payment Details
**GET** `/api/payments/details/:applicationId`

**Description:** Get payment details for an application

**Authentication:** Required (Borrower/Admin)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "payment_id",
      "amount": "$10.00",
      "transactionId": "cs_test_...",
      "email": "john@example.com",
      "paymentDate": "1/2/2024",
      "user": {
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  }
}
```

**Error Responses:**
- `403`: Access denied
- `404`: Payment not found

---

### 5. Get Payment Statistics
**GET** `/api/payments/stats`

**Description:** Get payment statistics (Admin only)

**Authentication:** Required (Admin)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalPayments": 150,
    "totalRevenue": 1500,
    "monthlyRevenue": [
      {
        "_id": {
          "year": 2024,
          "month": 1
        },
        "total": 500,
        "count": 50
      }
    ]
  }
}
```

---

### 6. Stripe Webhook
**POST** `/api/payments/webhook`

**Description:** Handle Stripe webhook events (no authentication)

**Headers:**
- `stripe-signature`: Stripe webhook signature

**Note:** This endpoint processes Stripe events automatically

---

## File Upload Routes (`/api/upload`)

### 1. Upload Loan Images
**POST** `/api/upload/loan-images`

**Description:** Upload loan images (Manager/Admin only)

**Authentication:** Required (Manager/Admin)

**Request:** multipart/form-data
- `images`: Array of image files (max 5 files, 5MB each)
- Supported formats: JPEG, PNG, GIF, WebP

**Response (200):**
```json
{
  "success": true,
  "message": "2 file(s) uploaded successfully",
  "data": {
    "files": [
      {
        "filename": "image-1234567890-123456789.jpg",
        "originalName": "loan-image.jpg",
        "size": 245678,
        "url": "http://localhost:3000/uploads/image-1234567890-123456789.jpg"
      }
    ]
  }
}
```

**Error Responses:**
- `400`: No files uploaded
- `400`: File too large (max 5MB)
- `400`: Too many files (max 5)
- `400`: Only image files are allowed
- `403`: Manager/Admin only

---

## Health Check & Documentation

### Health Check
**GET** `/api/health`

**Description:** Check server health status

**Response (200):**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

---

### API Documentation
**GET** `/api/docs`

**Description:** Get API endpoint information

**Response (200):**
```json
{
  "success": true,
  "message": "API Documentation",
  "endpoints": {
    "auth": "/api/auth",
    "users": "/api/users",
    "loans": "/api/loans",
    "applications": "/api/applications",
    "payments": "/api/payments",
    "upload": "/api/upload"
  }
}
```

---

## Authentication & Authorization

### Authentication Flow

1. **User Registration/Login:**
   - User provides credentials
   - Server validates and creates/verifies user
   - JWT token generated and stored in HTTP-only cookie
   - Token expires in 7 days (configurable)

2. **Protected Routes:**
   - Client sends request with cookie
   - Middleware extracts and verifies JWT token
   - User information attached to `req.user`
   - Request proceeds to controller

3. **Authorization:**
   - After authentication, role-based middleware checks user role
   - Only authorized roles can access specific endpoints

### Role Permissions

| Feature | Borrower | Manager | Admin |
|---------|----------|---------|-------|
| View Loans | ✅ | ✅ | ✅ |
| Submit Application | ✅ | ❌ | ❌ |
| View Own Applications | ✅ | ❌ | ❌ |
| Create Loan | ❌ | ✅ | ✅ |
| Manage Loans | ❌ | ✅ (own) | ✅ (all) |
| Approve/Reject Applications | ❌ | ✅ | ✅ |
| View All Applications | ❌ | ❌ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |
| Upload Images | ❌ | ✅ | ✅ |
| Payment Processing | ✅ | ❌ | ❌ |

---

## Middleware Flow

### Request Processing Order:

1. **CORS Middleware** - Handle cross-origin requests
2. **Helmet** - Security headers
3. **Rate Limiting** - Prevent abuse
4. **Body Parser** - Parse JSON/URL-encoded data
5. **Cookie Parser** - Parse cookies
6. **Route-specific Middleware:**
   - Authentication (`authenticate`)
   - Authorization (`authorize`)
   - Validation (`validateRegister`, `validateLoan`, etc.)
   - File Upload (`uploadLoanImages`)
7. **Controller** - Business logic
8. **Error Handler** - Global error handling

---

## Error Handling

### Error Response Format:
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

### HTTP Status Codes:

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (Validation Error) |
| 401 | Unauthorized (No/Invalid Token) |
| 403 | Forbidden (Insufficient Permissions) |
| 404 | Not Found |
| 500 | Internal Server Error |

### Error Types:

1. **Validation Errors (400):**
   - Missing required fields
   - Invalid data format
   - Value out of range

2. **Authentication Errors (401):**
   - No token provided
   - Invalid token
   - Expired token

3. **Authorization Errors (403):**
   - Insufficient role permissions
   - Account suspended
   - Access denied

4. **Not Found Errors (404):**
   - Resource doesn't exist
   - Invalid ID format

5. **Server Errors (500):**
   - Database connection issues
   - Unexpected errors

---

## Security Features

### 1. Password Security
- Passwords hashed using bcrypt (12 salt rounds)
- Minimum 6 characters
- Must contain uppercase and lowercase letters

### 2. JWT Authentication
- Tokens stored in HTTP-only cookies
- Prevents XSS attacks
- Token expiration: 7 days
- Secure flag in production

### 3. Rate Limiting
- General API: 100 requests per 15 minutes per IP
- Auth endpoints: 5 requests per 15 minutes per IP

### 4. Input Validation
- All inputs validated using express-validator
- SQL injection prevention (MongoDB)
- XSS prevention through sanitization

### 5. File Upload Security
- File type validation (images only)
- File size limit (5MB per file)
- File count limit (5 files max)
- Secure filename generation

### 6. CORS Configuration
- Configured for specific frontend origin
- Credentials enabled
- Specific methods allowed

### 7. Security Headers (Helmet)
- XSS protection
- Content Security Policy
- Frame options
- MIME type sniffing prevention

---

## Environment Variables

Required environment variables in `.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/loanlink

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend
FRONTEND_URL=http://localhost:3000
```

---

## API Usage Examples

### Example: Complete Loan Application Flow

1. **Register User:**
```bash
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123",
  "role": "borrower"
}
```

2. **Login:**
```bash
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "Password123"
}
```

3. **View Available Loans:**
```bash
GET /api/loans?category=personal
```

4. **Get Loan Details:**
```bash
GET /api/loans/:loan_id
```

5. **Submit Application:**
```bash
POST /api/applications
{
  "loanId": "loan_id",
  "firstName": "John",
  "lastName": "Doe",
  ...
}
```

6. **Manager Approves:**
```bash
PUT /api/applications/:application_id/approve
```

7. **Pay Application Fee:**
```bash
POST /api/payments/create-session
{
  "applicationId": "application_id"
}
```

8. **Check Payment Status:**
```bash
GET /api/payments/details/:application_id
```

---

## Testing

### Manual Testing with cURL:

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"Pass123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"Pass123"}' \
  -c cookies.txt

# Get Loans (with cookie)
curl http://localhost:5000/api/loans \
  -b cookies.txt
```

---

## Deployment Considerations

1. **Environment Variables:**
   - Use strong JWT_SECRET in production
   - Configure production MongoDB URI
   - Set NODE_ENV=production

2. **Security:**
   - Enable HTTPS
   - Configure CORS for production domain
   - Set secure cookie flags

3. **Performance:**
   - Enable MongoDB connection pooling
   - Use CDN for static files
   - Implement caching where appropriate

4. **Monitoring:**
   - Log all errors
   - Monitor API response times
   - Track payment transactions

---

## Support & Documentation

For additional support:
- Check `/api/health` for server status
- Review `/api/docs` for endpoint list
- Check README.md for setup instructions

---

**Last Updated:** 2024
**API Version:** 1.0.0