# ⚽ FootballZone - E-Commerce Platform  

![Football](https://img.shields.io/badge/Football-Merchandise-green)
![Node.js](https://img.shields.io/badge/Node.js-18.x-brightgreen)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

> Your ultimate destination for authentic football merchandise - jerseys, boots, accessories, and more from top clubs worldwide!

**FootballZone** is a full-stack e-commerce platform for football fans to buy authentic club merchandise. Built with **Node.js**, **Express**, and **MySQL**, it offers secure login, smart search, cart management, and an AI chatbot for recommendations — all in a sleek, responsive design.

---

## 🌟 Overview

**FootballZone** is a full-stack e-commerce web application designed for football enthusiasts. Shop authentic merchandise from legendary clubs like Real Madrid, FC Barcelona, Manchester United, Liverpool, and many more. Built with modern web technologies and a robust MySQL database backend.

---

## ✨ Features

### 🛍️ E-Commerce Core
- **Product Catalog** - Browse extensive collections of jerseys, boots, accessories, and equipment  
- **Smart Search** - Find products quickly with intelligent search functionality  
- **Advanced Filtering** - Filter by category, league, price, and ratings  
- **Shopping Cart** - Full cart management with size selection and quantity controls  
- **Persistent Cart** - Cart items saved to database across sessions  

### 👤 User Management
- **Secure Authentication** - JWT-based authentication with bcrypt password hashing  
- **User Registration & Login** - Create accounts and manage profiles  
- **Session Management** - Persistent login sessions with token validation  

### 💳 Order Processing
- **Real-time Cart Updates** - Instant cart count and total calculations  
- **Smart Pricing** - Automatic subtotal, tax (10%), and shipping calculations  
- **Free Shipping** - Orders over $75 ship free!  
- **Size Selection** - Choose from S, M, L, XL, XXL for jerseys  

### 🎨 User Interface
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile  
- **Modern UI** - Clean interface with smooth animations and gradients  
- **Team Colors** - Club-specific color schemes for jersey products  
- **Interactive Elements** - Hover effects, loading states, and modals  

### 🤖 AI Features
- **Chatbot Assistant** - AI-powered product recommendations and support  
- **Smart Responses** - Context-aware answers about products and shipping  

---

## 🏗️ Tech Stack

### Frontend
- **HTML5** - Semantic markup  
- **CSS3** - Modern styling with animations  
- **JavaScript (ES6+)** - Interactive functionality  
- **Font Awesome** - Icon library  

### Backend
- **Node.js** - Server-side JavaScript runtime  
- **Express.js** - Web application framework  
- **MySQL** - Relational database  
- **JWT** - JSON Web Token authentication  
- **bcrypt** - Password hashing  
- **CORS** - Cross-origin resource sharing  

### Database
- **MySQL 8.0+** - Robust relational database with 14+ tables  
- **Indexed Queries** - Optimized performance  
- **Foreign Keys** - Data integrity and relationships  

---

## 📁 Project Structure

footballzone/
├── Homepage.html # Main landing page
├── jerseys.html # Jersey products page
├── server.js # Node.js Express API server
├── api-client.js # Frontend API client
├── package.json # Node.js dependencies
├── .env # Environment variables (create this)
├── database/
│ └── schema.sql # Database schema
└── README.md # This file


---

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/footballzone.git
   cd footballzone
2. Install dependencies
   ```bash
   npm install
   
3. Setup MySQL Database
   ```bash
   mysql -u root -p
   CREATE DATABASE footballzone_db;
   mysql -u root -p footballzone_db < database/schema.sql

4. Configure Environment Variables
   ```bash
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password_here
   DB_NAME=footballzone_db
   PORT=3000
   JWT_SECRET=your_secret_key_here

5. Start the Server
   ```bash
   npm start

6. Open the Application
   Server: http://localhost:3000

   Website: Open Homepage.html in your browser

📊 Database Schema
Core Tables

users, products, categories, football_clubs, shopping_cart, cart_items, orders, order_items, addresses, wishlists, product_reviews, coupons

🔌 API Endpoints
1. Authentication
   ```bash
   POST /api/auth/register
   POST /api/auth/login
   GET  /api/auth/me

2. Products
   ```bash
   GET /api/products
   GET /api/products/category/:id
   GET /api/products/search?q=
   GET /api/products/:id

3. Shopping Cart
   ```bash
   GET    /api/cart
   POST   /api/cart/add
   PUT    /api/cart/update/:id
   DELETE /api/cart/remove/:id
   DELETE /api/cart/clear

4. Orders
   ```bash
   POST /api/orders
   GET  /api/orders
   GET  /api/orders/:id

🎯 Product Categories
Category	Products	Price Range
👟 Football Boots	Nike, Adidas, Puma	$99 - $299
👕 Jerseys	Home, Away, Third kits	$69 - $99
🔑 Accessories	Keychains, pins, scarves	$9 - $49
🎒 Bags	Boot bags, backpacks	$29 - $79
🚩 Flags	Club flags, banners	$19 - $39
⚽ Equipment	Balls, gloves, training gear	$15 - $89
🏆 Featured Clubs

Premier League: Manchester United, Liverpool, Chelsea, Arsenal

La Liga: Real Madrid, FC Barcelona, Atletico Madrid

Serie A: Juventus, AC Milan, Inter Milan

Bundesliga: Bayern Munich, Borussia Dortmund

Ligue 1: Paris Saint-Germain

National Teams: Brazil, Argentina

🔒 Security Features

✅ Password hashing with bcrypt
✅ JWT token-based authentication
✅ SQL injection prevention with prepared statements
✅ CORS protection
✅ Environment variable configuration
✅ Secure session management

📱 Responsive Design

✅ Mobile-optimized interface

✅ Tablet-friendly layouts

✅ Desktop experience

✅ Touch-optimized controls

✅ Adaptive grid system

🛠️ Development
* Run in Development Mode
  ```bash 
  npm run dev

* Database Commands
  ```bash
  SELECT * FROM products;
  SELECT * FROM users;
  SELECT ci.*, p.product_name 
  FROM cart_items ci 
  JOIN products p ON ci.product_id = p.product_id;

* Testing
  ```bash
  curl http://localhost:3000/api/products
  curl http://localhost:3000/api/categories

🐛 Troubleshooting
Server won't start

Check if MySQL is running

Verify .env file configuration

Ensure port 3000 is not in use

Database connection failed

Check MySQL credentials in .env

Verify database footballzone_db exists

Check MySQL service is running

Products not loading

Run database schema and insert statements

Check browser console for errors

Verify API endpoint is accessible

📈 Future Enhancements

 Payment gateway integration (Stripe, PayPal)

 Email notifications

 Order tracking system

 Admin dashboard

 Product reviews and ratings

 Advanced analytics

 Mobile app version

 Social media integration

 Live chat support

 Multi-currency support

🤝 Contributing

Fork the project

Create your feature branch (git checkout -b feature/AmazingFeature)

Commit your changes (git commit -m 'Add some AmazingFeature')

Push to the branch (git push origin feature/AmazingFeature)

Open a Pull Request

📝 License

This project is licensed under the MIT License — see the LICENSE
 file for details.

👨‍💻 Author

Freddy Fernandes

GitHub: @Freddy-Fernandes

LinkedIn: Your Name

🙏 Acknowledgments

Font Awesome for icons

Node.js and Express.js communities

MySQL database system

All football clubs for inspiration

📞 Support

For support, email your-email@example.com
 or open an issue in the repository.

⚽ Built with ❤️ for football fans worldwide 🏆


---

Would you like me to automatically include **your name and GitHub handle** in the “Author” section before I finalize it for you?
## 📁 Project Structure

