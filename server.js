// server.js - Node.js Express API Server for FootballZone
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'footballzone_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test database connection
pool.getConnection()
    .then(connection => {
        console.log('✅ Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err);
    });

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// ============= AUTH ROUTES =============

// Register new user
app.post('/api/auth/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        // Validate input
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if user exists
        const [existing] = await pool.query(
            'SELECT user_id FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await pool.query(
            'INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)',
            [firstName, lastName, email, hashedPassword]
        );

        // Generate token
        const token = jwt.sign(
            { userId: result.insertId, email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                userId: result.insertId,
                firstName,
                lastName,
                email
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Get user
        const [users] = await pool.query(
            'SELECT user_id, first_name, last_name, email, password_hash FROM users WHERE email = ? AND is_active = 1',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = users[0];

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user.user_id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                userId: user.user_id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT user_id, first_name, last_name, email, phone, user_type, created_at FROM users WHERE user_id = ?',
            [req.user.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: users[0] });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// ============= PRODUCT ROUTES =============

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const [products] = await pool.query(`
            SELECT p.*, c.category_name, c.category_slug, fc.club_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN football_clubs fc ON p.club_id = fc.club_id
            WHERE p.is_active = 1
            ORDER BY p.is_featured DESC, p.created_at DESC
        `);

        res.json({ products });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Failed to get products' });
    }
});

// Get products by category
app.get('/api/products/category/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        const [products] = await pool.query(`
            SELECT p.*, c.category_name, fc.club_name 
            FROM products p
            INNER JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN football_clubs fc ON p.club_id = fc.club_id
            WHERE c.category_slug = ? AND p.is_active = 1
            ORDER BY p.created_at DESC
        `, [slug]);

        res.json({ products });
    } catch (error) {
        console.error('Get category products error:', error);
        res.status(500).json({ error: 'Failed to get products' });
    }
});

// Search products
app.get('/api/products/search', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({ error: 'Search query required' });
        }

        const searchTerm = `%${q}%`;

        const [products] = await pool.query(`
            SELECT p.*, c.category_name, fc.club_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN football_clubs fc ON p.club_id = fc.club_id
            WHERE p.is_active = 1 
            AND (p.product_name LIKE ? OR p.description LIKE ? OR c.category_name LIKE ?)
            ORDER BY p.rating DESC
        `, [searchTerm, searchTerm, searchTerm]);

        res.json({ products });
    } catch (error) {
        console.error('Search products error:', error);
        res.status(500).json({ error: 'Failed to search products' });
    }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [products] = await pool.query(`
            SELECT p.*, c.category_name, c.category_slug, fc.club_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN football_clubs fc ON p.club_id = fc.club_id
            WHERE p.product_id = ?
        `, [id]);

        if (products.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ product: products[0] });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Failed to get product' });
    }
});

// ============= CATEGORY ROUTES =============

// Get all categories
app.get('/api/categories', async (req, res) => {
    try {
        const [categories] = await pool.query(`
            SELECT * FROM categories 
            WHERE is_active = 1 
            ORDER BY display_order ASC
        `);

        res.json({ categories });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to get categories' });
    }
});

// ============= CART ROUTES =============

// Get cart
app.get('/api/cart', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get or create cart
        let [carts] = await pool.query(
            'SELECT cart_id FROM shopping_cart WHERE user_id = ?',
            [userId]
        );

        let cartId;
        if (carts.length === 0) {
            const [result] = await pool.query(
                'INSERT INTO shopping_cart (user_id) VALUES (?)',
                [userId]
            );
            cartId = result.insertId;
        } else {
            cartId = carts[0].cart_id;
        }

        // Get cart items
        const [items] = await pool.query(`
            SELECT ci.*, p.product_name, p.price, p.stock_quantity,
            (ci.quantity * p.price) as subtotal
            FROM cart_items ci
            INNER JOIN products p ON ci.product_id = p.product_id
            WHERE ci.cart_id = ?
        `, [cartId]);

        const total = items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

        res.json({ cartId, items, total });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ error: 'Failed to get cart' });
    }
});

// Add to cart
app.post('/api/cart/add', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { productId, quantity = 1, size = null, color = null } = req.body;

        // Get or create cart
        let [carts] = await pool.query(
            'SELECT cart_id FROM shopping_cart WHERE user_id = ?',
            [userId]
        );

        let cartId;
        if (carts.length === 0) {
            const [result] = await pool.query(
                'INSERT INTO shopping_cart (user_id) VALUES (?)',
                [userId]
            );
            cartId = result.insertId;
        } else {
            cartId = carts[0].cart_id;
        }

        // Check if item exists
        const [existing] = await pool.query(
            'SELECT cart_item_id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ? AND (size = ? OR (size IS NULL AND ? IS NULL)) AND (color = ? OR (color IS NULL AND ? IS NULL))',
            [cartId, productId, size, size, color, color]
        );

        if (existing.length > 0) {
            // Update quantity
            const newQuantity = existing[0].quantity + quantity;
            await pool.query(
                'UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?',
                [newQuantity, existing[0].cart_item_id]
            );
        } else {
            // Insert new item
            await pool.query(
                'INSERT INTO cart_items (cart_id, product_id, quantity, size, color) VALUES (?, ?, ?, ?, ?)',
                [cartId, productId, quantity, size, color]
            );
        }

        res.json({ message: 'Item added to cart' });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ error: 'Failed to add to cart' });
    }
});

// Remove from cart
app.delete('/api/cart/remove/:itemId', authenticateToken, async (req, res) => {
    try {
        const { itemId } = req.params;

        await pool.query(
            'DELETE FROM cart_items WHERE cart_item_id = ?',
            [itemId]
        );

        res.json({ message: 'Item removed from cart' });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({ error: 'Failed to remove from cart' });
    }
});

// Update cart item quantity
app.put('/api/cart/update/:itemId', authenticateToken, async (req, res) => {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;

        if (quantity < 1) {
            return res.status(400).json({ error: 'Quantity must be at least 1' });
        }

        await pool.query(
            'UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?',
            [quantity, itemId]
        );

        res.json({ message: 'Cart updated' });
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({ error: 'Failed to update cart' });
    }
});

// Clear cart
app.delete('/api/cart/clear', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const [carts] = await pool.query(
            'SELECT cart_id FROM shopping_cart WHERE user_id = ?',
            [userId]
        );

        if (carts.length > 0) {
            await pool.query(
                'DELETE FROM cart_items WHERE cart_id = ?',
                [carts[0].cart_id]
            );
        }

        res.json({ message: 'Cart cleared' });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({ error: 'Failed to clear cart' });
    }
});

// ============= ORDER ROUTES =============

// Create order
app.post('/api/orders', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const userId = req.user.userId;
        const { shippingAddressId, billingAddressId, paymentMethod } = req.body;

        // Get cart items
        const [carts] = await connection.query(
            'SELECT cart_id FROM shopping_cart WHERE user_id = ?',
            [userId]
        );

        if (carts.length === 0) {
            throw new Error('Cart not found');
        }

        const cartId = carts[0].cart_id;

        const [items] = await connection.query(`
            SELECT ci.*, p.product_name, p.price,
            (ci.quantity * p.price) as subtotal
            FROM cart_items ci
            INNER JOIN products p ON ci.product_id = p.product_id
            WHERE ci.cart_id = ?
        `, [cartId]);

        if (items.length === 0) {
            throw new Error('Cart is empty');
        }

        // Calculate totals
        const subtotal = items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
        const shippingCost = subtotal > 75 ? 0 : 10;
        const taxAmount = subtotal * 0.1;
        const totalAmount = subtotal + shippingCost + taxAmount;

        // Generate order number
        const orderNumber = 'FZ' + Date.now();

        // Create order
        const [orderResult] = await connection.query(
            `INSERT INTO orders (user_id, order_number, subtotal, shipping_cost, tax_amount, 
             total_amount, shipping_address_id, billing_address_id, payment_method)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, orderNumber, subtotal, shippingCost, taxAmount, totalAmount,
                shippingAddressId, billingAddressId, paymentMethod]
        );

        const orderId = orderResult.insertId;

        // Insert order items
        for (const item of items) {
            await connection.query(
                `INSERT INTO order_items (order_id, product_id, product_name, quantity, 
                 size, color, unit_price, subtotal)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [orderId, item.product_id, item.product_name, item.quantity,
                    item.size, item.color, item.price, item.subtotal]
            );
        }

        // Clear cart
        await connection.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);

        await connection.commit();

        res.status(201).json({
            message: 'Order created successfully',
            orderId,
            orderNumber,
            totalAmount
        });
    } catch (error) {
        await connection.rollback();
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Failed to create order' });
    } finally {
        connection.release();
    }
});

// Get user orders
app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const [orders] = await pool.query(
            'SELECT * FROM orders WHERE user_id = ? ORDER BY order_date DESC',
            [userId]
        );

        res.json({ orders });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Failed to get orders' });
    }
});

// Get order details
app.get('/api/orders/:orderId', authenticateToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.userId;

        const [orders] = await pool.query(
            'SELECT * FROM orders WHERE order_id = ? AND user_id = ?',
            [orderId, userId]
        );

        if (orders.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const [items] = await pool.query(
            'SELECT * FROM order_items WHERE order_id = ?',
            [orderId]
        );

        res.json({ order: orders[0], items });
    } catch (error) {
        console.error('Get order details error:', error);
        res.status(500).json({ error: 'Failed to get order details' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 FootballZone API Server running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
    const express = require('express');
    const app = express();
    const port = 3000;

    // Serve static files from 'public' folder
    app.use(express.static('public'));

    // Start server
    app.listen(port, '0.0.0.0', () => console.log('Server running'));
});