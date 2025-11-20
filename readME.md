# NeuraFund Platform

NeuraFund is a platform that connects campus students seeking quick income with local business owners needing short-term help. The system enables vendors to post simple tasks (stock pickups, deliveries, etc.) and allows students to complete them for instant cash payments.

## Project Structure

```
neurafund-platform/
├── backend/                 # Node.js/Express API server
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API endpoints
│   ├── middleware/         # Authentication & validation
│   ├── server.js           # Main server file
│   └── package.json        # Backend dependencies
├── frontend/               # React.js application
│   ├── src/                # React components
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
└── README.md
```

## Technology Stack

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File uploads

### Frontend

- **React.js** - UI framework
- **React Router** - Navigation
- **Axios** - HTTP client

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create environment variables:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration.

4. Start the development server:

```bash
npm run dev
```

The backend API will be available at `http://localhost:5001`

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

The frontend will be available at `http://localhost:3000`

## API Endpoints

### Authentication

- `POST /api/auth/register/student` - Student registration
- `POST /api/auth/register/vendor` - Vendor registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify-email/:token` - Email verification
- `GET /api/auth/me` - Get current user profile

### Tasks (To be implemented)

- `GET /api/tasks` - Get tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id/assign` - Assign task
- `PUT /api/tasks/:id/submit-proof` - Submit proof
- `PUT /api/tasks/:id/review` - Review proof

### Wallet (To be implemented)

- `GET /api/wallet/balance` - Get balance
- `POST /api/wallet/deposit` - Mock deposit
- `POST /api/wallet/withdraw` - Mock withdrawal
- `GET /api/wallet/transactions` - Transaction history

### Ratings (To be implemented)

- `POST /api/ratings` - Submit rating
- `GET /api/ratings/user/:id` - Get user ratings

## Features

### Completed

- ✅ Project structure setup
- ✅ Database schemas (User, Task, Rating, Transaction)
- ✅ Authentication system with JWT
- ✅ User registration (students and vendors)
- ✅ Email verification system
- ✅ Role-based access control
- ✅ Basic frontend structure

### In Progress

- 🔄 Task management system
- 🔄 File upload for task proofs
- 🔄 Wallet and payment system
- 🔄 Rating system
- 🔄 Frontend components

### Planned

- 📋 Complete React frontend
- 📋 Real-time notifications
- 📋 Mobile responsiveness
- 📋 Advanced filtering and search

## Development Status

This project is currently in development. The foundation and authentication system are complete. The next phases will implement task management, wallet functionality, and the complete frontend interface.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
