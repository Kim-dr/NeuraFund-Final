# NeuraFund Frontend

React-based frontend for the NeuraFund platform connecting students with local vendors for task completion.

## Features Implemented

### Authentication System

- **Login**: JWT-based authentication with role-based redirection
- **Student Registration**: University email validation and student-specific fields
- **Vendor Registration**: Business details and vendor-specific fields
- **Protected Routes**: Role-based access control for dashboards
- **Auth Context**: Global authentication state management

### Student Dashboard

- **Task Browsing**: View all available tasks with filtering
- **Task Filters**: Filter by location, minimum reward, and maximum time
- **Task Assignment**: Claim available tasks
- **My Tasks**: View assigned and completed tasks
- **Proof Upload**: Submit completion proof with file uploads
- **Wallet Display**: View current balance

### Vendor Dashboard

- **Task Creation**: Create new tasks with detailed requirements
- **Task Management**: View tasks by status (available, in-progress, pending review, completed)
- **Proof Review**: Review submitted proof with approve/reject functionality
- **Wallet Display**: View current balance

### Task Components

- **TaskCard**: Reusable task display component with status badges
- **TaskFilters**: Location, payment, and time filtering interface
- **TaskForm**: Task creation form with validation
- **ProofUpload**: File upload interface for task completion proof
- **ProofReview**: Proof review interface with image preview

### UI/UX Features

- **Responsive Design**: Mobile and desktop compatibility
- **Navigation Bar**: Dynamic navigation based on authentication state
- **Error Handling**: User-friendly error messages
- **Loading States**: Loading indicators for async operations
- **Success Messages**: Confirmation messages for actions

## Project Structure

```
frontend/src/
├── components/
│   ├── Navbar.js              # Navigation bar component
│   ├── ProtectedRoute.js      # Route protection wrapper
│   ├── TaskCard.js            # Task display component
│   ├── TaskFilters.js         # Task filtering component
│   ├── TaskForm.js            # Task creation form
│   ├── ProofUpload.js         # Proof upload component
│   └── ProofReview.js         # Proof review component
├── context/
│   └── AuthContext.js         # Authentication context provider
├── pages/
│   ├── Home.js                # Landing page
│   ├── Login.js               # Login page
│   ├── StudentRegister.js     # Student registration page
│   ├── VendorRegister.js      # Vendor registration page
│   ├── StudentDashboard.js    # Student dashboard
│   └── VendorDashboard.js     # Vendor dashboard
├── utils/
│   └── api.js                 # Axios API configuration
├── App.js                     # Main app component with routing
├── App.css                    # Global styles
└── index.js                   # App entry point
```

## Running the Application

### Development Mode

```bash
npm start
```

Runs on http://localhost:3000

### Production Build

```bash
npm run build
```

### Environment Variables

Create a `.env` file in the frontend directory:

```
REACT_APP_API_URL=http://localhost:5001/api
```

## API Integration

The frontend integrates with the backend API using Axios with:

- Automatic JWT token attachment to requests
- Request/response interceptors for error handling
- Automatic redirect to login on 401 errors

## Requirements Covered

This implementation addresses the following requirements:

- **3.1**: JWT-based authentication with role-based redirection
- **3.2**: Role-specific dashboard redirection (student/vendor)
- **4.1**: Task creation with detailed requirements
- **4.2**: Task posting with status management
- **4.5**: Task display in vendor dashboard
- **5.1**: Available task browsing for students
- **5.2**: Location, payment, and type filtering
- **5.3**: Task details display with all information
- **6.1**: Task claiming and status updates
- **6.4**: Vendor notification of task assignment
- **6.5**: Student dashboard updates with active tasks
- **12.3**: Full functionality across device types

## Next Steps

The following features are planned for future tasks:

- Wallet management interface (deposits/withdrawals)
- Rating system UI
- Real-time notifications with toast messages
- Transaction history display
