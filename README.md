# QuickServe QR - Hotel Table Ordering System

A full-stack, real-time, smart table ordering system that allows hotel guests to scan a QR code, view the menu, place orders, and pay instantly. The kitchen receives orders in real-time, managed by a smart queue system prioritizing fairness and preparation time.

## 🚀 Tech Stack
- **Frontend**: React + Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express, Socket.IO
- **Database**: MongoDB (Mongoose)

## 💡 Key Features
- **QR Code Ordering**: Auto-detects table number from QR url (`/menu?table=5`).
- **Real-Time Kitchen Dashboard**: Kitchen sees orders instantly without page refresh (Socket.IO).
- **Smart Queue Logic**: Orders are queued based on a priority score combining timestamp and estimated preparation time.
- **Mock Payment**: Simulates a payment gateway flow before placing the order.
- **Live Status Tracking**: Customers can see real-time updates (Preparing, Ready) on their order status page.

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on port 27017

### 1. Backend Setup
```bash
cd server
npm install

# Seed the database with sample menu items and users
npm run seed

# Start server (runs on port 5000)
npm run dev
```

### 2. Frontend Setup
```bash
cd client
npm install

# Start React app (runs on port 5173)
npm run dev
```

## 📱 URL Paths / Demo Flow
1. **Demo Table URL**: `http://localhost:5173/menu?table=5` (Simulates a customer scanning Table 5's QR code).
2. **Kitchen Dashboard**: `http://localhost:5173/kitchen`
   - **Login**: `kitchen@quickserve.com`
   - **Password**: `kitchen123`
   
**Test Flow**: Open the Kitchen Dashboard in one tab, and the Demo Table URL in another tab. Make an order on the table URL, complete the mock payment, and watch it instantly pop up on the Kitchen Dashboard!
