<<<<<<< HEAD
// api-client.js - Frontend API client for FootballZone
// Add this script to your Homepage.html

const API_BASE_URL = 'http://localhost:3000/api';

class FootballZoneAPI {
    constructor() {
        this.token = localStorage.getItem('fz_token');
    }

    // Helper method to make API calls
    async request(endpoint, options = {}) {
        const url = 'http://192.168.0.109:3000/api';
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('fz_token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('fz_token');
    }

    // ============= AUTH METHODS =============

    async register(firstName, lastName, email, password) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ firstName, lastName, email, password })
        });

        if (data.token) {
            this.setToken(data.token);
        }

        return data;
    }

    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (data.token) {
            this.setToken(data.token);
        }

        return data;
    }

    async getCurrentUser() {
        return await this.request('/auth/me');
    }

    logout() {
        this.clearToken();
    }

    // ============= PRODUCT METHODS =============

    async getAllProducts() {
        return await this.request('/products');
    }

    async getProductsByCategory(categorySlug) {
        return await this.request(`/products/category/${categorySlug}`);
    }

    async searchProducts(query) {
        return await this.request(`/products/search?q=${encodeURIComponent(query)}`);
    }

    async getProduct(productId) {
        return await this.request(`/products/${productId}`);
    }

    // ============= CATEGORY METHODS =============

    async getAllCategories() {
        return await this.request('/categories');
    }

    // ============= CART METHODS =============

    async getCart() {
        return await this.request('/cart');
    }

    async addToCart(productId, quantity = 1, size = null, color = null) {
        return await this.request('/cart/add', {
            method: 'POST',
            body: JSON.stringify({ productId, quantity, size, color })
        });
    }

    async removeFromCart(itemId) {
        return await this.request(`/cart/remove/${itemId}`, {
            method: 'DELETE'
        });
    }

    async updateCartItem(itemId, quantity) {
        return await this.request(`/cart/update/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity })
        });
    }

    async clearCart() {
        return await this.request('/cart/clear', {
            method: 'DELETE'
        });
    }

    // ============= ORDER METHODS =============

    async createOrder(shippingAddressId, billingAddressId, paymentMethod) {
        return await this.request('/orders', {
            method: 'POST',
            body: JSON.stringify({ shippingAddressId, billingAddressId, paymentMethod })
        });
    }

    async getUserOrders() {
        return await this.request('/orders');
    }

    async getOrderDetails(orderId) {
        return await this.request(`/orders/${orderId}`);
    }
}

// Initialize API client
const api = new FootballZoneAPI();

// ============= UPDATED FUNCTIONS FOR YOUR HTML =============

// Replace the existing Database class functions with these API calls

async function handleSignup(event) {
    event.preventDefault();

    const fullName = document.getElementById('signupName').value;
    const [firstName, ...lastNameParts] = fullName.split(' ');
    const lastName = lastNameParts.join(' ') || firstName;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }

    try {
        const response = await api.register(firstName, lastName, email, password);
        closeModal('signupModal');
        showUserInfo(response.user);
        showNotification(`Welcome to FootballZone, ${response.user.firstName}!`, 'success');
        await loadProducts();
        updateCartCount();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await api.login(email, password);
        closeModal('loginModal');
        showUserInfo(response.user);
        showNotification(`Welcome back, ${response.user.firstName}!`, 'success');
        await loadProducts();
        updateCartCount();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function logout() {
    api.logout();
    hideUserInfo();
    updateCartCount();
    showNotification('Logged out successfully', 'success');
    loadProducts();
}

async function loadProducts(filter = null) {
    try {
        const productGrid = document.getElementById('productGrid');
        productGrid.innerHTML = '<div style="text-align: center; padding: 2rem;">Loading products...</div>';

        let response;
        if (filter) {
            response = await api.getProductsByCategory(filter);
        } else {
            response = await api.getAllProducts();
        }

        const products = response.products;

        if (products.length === 0) {
            productGrid.innerHTML = '<div style="text-align: center; padding: 2rem;">No products found</div>';
            return;
        }

        productGrid.innerHTML = products.map(product => `
            <div class="product-card">
                <div class="product-image">
                    <span style="font-size: 3rem;">${getProductEmoji(product.category_slug)}</span>
                    ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
                </div>
                <div class="product-content">
                    <div class="product-title">${product.product_name}</div>
                    <div class="product-price">$${product.price}</div>
                    <div class="product-rating">
                        <div class="stars">
                            ${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5 - Math.floor(product.rating))}
                        </div>
                        <span>(${product.rating})</span>
                    </div>
                    <button class="add-to-cart" onclick="addToCart(${product.product_id})">
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('productGrid').innerHTML =
            '<div style="text-align: center; padding: 2rem; color: red;">Failed to load products</div>';
    }
}

function getProductEmoji(categorySlug) {
    const emojis = {
        'boots': '👟',
        'jerseys': '👕',
        'accessories': '🔑',
        'bags': '🎒',
        'flags': '🚩',
        'equipment': '⚽'
    };
    return emojis[categorySlug] || '⚽';
}

async function searchProducts() {
    const searchTerm = document.getElementById('searchInput').value.trim();

    if (!searchTerm) {
        await loadProducts();
        return;
    }

    try {
        const response = await api.searchProducts(searchTerm);
        const products = response.products;

        const productGrid = document.getElementById('productGrid');

        if (products.length === 0) {
            productGrid.innerHTML = '<div style="text-align: center; padding: 2rem;">No products found matching your search</div>';
            scrollToSection('products');
            return;
        }

        productGrid.innerHTML = products.map(product => `
            <div class="product-card">
                <div class="product-image">
                    <span style="font-size: 3rem;">${getProductEmoji(product.category_slug)}</span>
                    ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
                </div>
                <div class="product-content">
                    <div class="product-title">${product.product_name}</div>
                    <div class="product-price">$${product.price}</div>
                    <div class="product-rating">
                        <div class="stars">
                            ${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5 - Math.floor(product.rating))}
                        </div>
                        <span>(${product.rating})</span>
                    </div>
                    <button class="add-to-cart" onclick="addToCart(${product.product_id})">
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                </div>
            </div>
        `).join('');

        scrollToSection('products');
    } catch (error) {
        console.error('Error searching products:', error);
        const productGrid = document.getElementById('productGrid');
        productGrid.innerHTML =
            '<div style="text-align: center; padding: 2rem; color: red;">Failed to search products. Please try again later.</div>';
    }
}
// Replace the existing authentication functions in your Homepage.html with these:

// Handle User Signup
async function handleSignup(event) {
    event.preventDefault();
    
    const fullName = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
    if (!fullName || !email || !password || !confirmPassword) {
        showNotification('All fields are required', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }
    
    // Split full name into first and last name
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
    submitBtn.disabled = true;
    
    try {
        // Call API to register user
        const response = await api.register(firstName, lastName, email, password);
        
        // Close modal
        closeModal('signupModal');
        
        // Clear form
        document.getElementById('signupForm').reset();
        
        // Update UI to show logged in user
        showUserInfo(response.user);
        
        // Update cart count
        await updateCartCount();
        
        // Show success message
        showNotification(`Welcome to FootballZone, ${response.user.firstName}!`, 'success');
        
        // Reload products if needed
        if (typeof loadProducts === 'function') {
            await loadProducts();
        }
        
    } catch (error) {
        console.error('Signup error:', error);
        showNotification(error.message || 'Registration failed. Please try again.', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Handle User Login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    // Validation
    if (!email || !password) {
        showNotification('Email and password are required', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    submitBtn.disabled = true;
    
    try {
        // Call API to login user
        const response = await api.login(email, password);
        
        // Close modal
        closeModal('loginModal');
        
        // Clear form
        document.getElementById('loginForm').reset();
        
        // Update UI to show logged in user
        showUserInfo(response.user);
        
        // Update cart count
        await updateCartCount();
        
        // Show success message
        showNotification(`Welcome back, ${response.user.firstName}!`, 'success');
        
        // Reload products if needed
        if (typeof loadProducts === 'function') {
            await loadProducts();
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showNotification(error.message || 'Invalid email or password', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Handle Logout
function logout() {
    if (!confirm('Are you sure you want to logout?')) {
        return;
    }
    
    // Clear token from API client
    api.logout();
    
    // Update UI
    hideUserInfo();
    
    // Reset cart count
    document.getElementById('cartCount').textContent = '0';
    
    // Show notification
    showNotification('Logged out successfully', 'success');
    
    // Reload products if needed
    if (typeof loadProducts === 'function') {
        loadProducts();
    }
}

// Show user info in navbar
function showUserInfo(user) {
    const userInfo = document.getElementById('userInfo');
    const userWelcome = document.getElementById('userWelcome');
    const authButtons = document.getElementById('authButtons');
    
    if (userInfo && userWelcome && authButtons) {
        userWelcome.textContent = `Welcome, ${user.firstName}!`;
        userInfo.style.display = 'flex';
        authButtons.style.display = 'none';
    }
}

// Hide user info (show auth buttons)
function hideUserInfo() {
    const userInfo = document.getElementById('userInfo');
    const authButtons = document.getElementById('authButtons');
    
    if (userInfo && authButtons) {
        userInfo.style.display = 'none';
        authButtons.style.display = 'block';
    }
}

// Check if user is already logged in on page load
async function checkAuthStatus() {
    if (!api.token) {
        hideUserInfo();
        return;
    }
    
    try {
        const response = await api.getCurrentUser();
        showUserInfo(response.user);
        await updateCartCount();
    } catch (error) {
        // Token expired or invalid
        console.log('Token invalid, logging out');
        api.logout();
        hideUserInfo();
    }
}

// Update cart count
async function updateCartCount() {
    if (!api.token) {
        document.getElementById('cartCount').textContent = '0';
        return;
    }
    
    try {
        const response = await api.getCart();
        const count = response.items.reduce((total, item) => total + item.quantity, 0);
        document.getElementById('cartCount').textContent = count;
    } catch (error) {
        console.error('Error updating cart count:', error);
        document.getElementById('cartCount').textContent = '0';
    }
}

// Modal functions
function openLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function openSignupModal() {
    document.getElementById('signupModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function switchToSignup() {
    closeModal('loginModal');
    openSignupModal();
}

function switchToLogin() {
    closeModal('signupModal');
    openLoginModal();
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 3000;
        font-weight: bold;
        animation: slideInRight 0.3s ease-out;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    `;
    
    const icon = type === 'success' ? 
        '<i class="fas fa-check-circle"></i>' : 
        '<i class="fas fa-exclamation-circle"></i>';
    
    notification.innerHTML = `${icon} ${message}`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add CSS animations for notifications
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(styleSheet);

// Close modals when clicking outside
window.onclick = function(event) {
    const loginModal = document.getElementById('loginModal');
    const signupModal = document.getElementById('signupModal');
    
    if (event.target === loginModal) {
        closeModal('loginModal');
    }
    if (event.target === signupModal) {
        closeModal('signupModal');
    }
}

// Initialize authentication check on page load
document.addEventListener('DOMContentLoaded', async function() {
    console.log('FootballZone initialized with database connection');
    
    // Check if user is logged in
    await checkAuthStatus();
    
    // Load products if function exists
    if (typeof loadProducts === 'function') {
        await loadProducts();
    }
=======
// api-client.js - Frontend API client for FootballZone
// Add this script to your Homepage.html

const API_BASE_URL = 'http://localhost:3000/api';

class FootballZoneAPI {
    constructor() {
        this.token = localStorage.getItem('fz_token');
    }

    // Helper method to make API calls
    async request(endpoint, options = {}) {
        const url = 'http://192.168.0.109:3000/api';
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('fz_token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('fz_token');
    }

    // ============= AUTH METHODS =============

    async register(firstName, lastName, email, password) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ firstName, lastName, email, password })
        });

        if (data.token) {
            this.setToken(data.token);
        }

        return data;
    }

    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (data.token) {
            this.setToken(data.token);
        }

        return data;
    }

    async getCurrentUser() {
        return await this.request('/auth/me');
    }

    logout() {
        this.clearToken();
    }

    // ============= PRODUCT METHODS =============

    async getAllProducts() {
        return await this.request('/products');
    }

    async getProductsByCategory(categorySlug) {
        return await this.request(`/products/category/${categorySlug}`);
    }

    async searchProducts(query) {
        return await this.request(`/products/search?q=${encodeURIComponent(query)}`);
    }

    async getProduct(productId) {
        return await this.request(`/products/${productId}`);
    }

    // ============= CATEGORY METHODS =============

    async getAllCategories() {
        return await this.request('/categories');
    }

    // ============= CART METHODS =============

    async getCart() {
        return await this.request('/cart');
    }

    async addToCart(productId, quantity = 1, size = null, color = null) {
        return await this.request('/cart/add', {
            method: 'POST',
            body: JSON.stringify({ productId, quantity, size, color })
        });
    }

    async removeFromCart(itemId) {
        return await this.request(`/cart/remove/${itemId}`, {
            method: 'DELETE'
        });
    }

    async updateCartItem(itemId, quantity) {
        return await this.request(`/cart/update/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity })
        });
    }

    async clearCart() {
        return await this.request('/cart/clear', {
            method: 'DELETE'
        });
    }

    // ============= ORDER METHODS =============

    async createOrder(shippingAddressId, billingAddressId, paymentMethod) {
        return await this.request('/orders', {
            method: 'POST',
            body: JSON.stringify({ shippingAddressId, billingAddressId, paymentMethod })
        });
    }

    async getUserOrders() {
        return await this.request('/orders');
    }

    async getOrderDetails(orderId) {
        return await this.request(`/orders/${orderId}`);
    }
}

// Initialize API client
const api = new FootballZoneAPI();

// ============= UPDATED FUNCTIONS FOR YOUR HTML =============

// Replace the existing Database class functions with these API calls

async function handleSignup(event) {
    event.preventDefault();

    const fullName = document.getElementById('signupName').value;
    const [firstName, ...lastNameParts] = fullName.split(' ');
    const lastName = lastNameParts.join(' ') || firstName;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }

    try {
        const response = await api.register(firstName, lastName, email, password);
        closeModal('signupModal');
        showUserInfo(response.user);
        showNotification(`Welcome to FootballZone, ${response.user.firstName}!`, 'success');
        await loadProducts();
        updateCartCount();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await api.login(email, password);
        closeModal('loginModal');
        showUserInfo(response.user);
        showNotification(`Welcome back, ${response.user.firstName}!`, 'success');
        await loadProducts();
        updateCartCount();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function logout() {
    api.logout();
    hideUserInfo();
    updateCartCount();
    showNotification('Logged out successfully', 'success');
    loadProducts();
}

async function loadProducts(filter = null) {
    try {
        const productGrid = document.getElementById('productGrid');
        productGrid.innerHTML = '<div style="text-align: center; padding: 2rem;">Loading products...</div>';

        let response;
        if (filter) {
            response = await api.getProductsByCategory(filter);
        } else {
            response = await api.getAllProducts();
        }

        const products = response.products;

        if (products.length === 0) {
            productGrid.innerHTML = '<div style="text-align: center; padding: 2rem;">No products found</div>';
            return;
        }

        productGrid.innerHTML = products.map(product => `
            <div class="product-card">
                <div class="product-image">
                    <span style="font-size: 3rem;">${getProductEmoji(product.category_slug)}</span>
                    ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
                </div>
                <div class="product-content">
                    <div class="product-title">${product.product_name}</div>
                    <div class="product-price">$${product.price}</div>
                    <div class="product-rating">
                        <div class="stars">
                            ${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5 - Math.floor(product.rating))}
                        </div>
                        <span>(${product.rating})</span>
                    </div>
                    <button class="add-to-cart" onclick="addToCart(${product.product_id})">
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('productGrid').innerHTML =
            '<div style="text-align: center; padding: 2rem; color: red;">Failed to load products</div>';
    }
}

function getProductEmoji(categorySlug) {
    const emojis = {
        'boots': '👟',
        'jerseys': '👕',
        'accessories': '🔑',
        'bags': '🎒',
        'flags': '🚩',
        'equipment': '⚽'
    };
    return emojis[categorySlug] || '⚽';
}

async function searchProducts() {
    const searchTerm = document.getElementById('searchInput').value.trim();

    if (!searchTerm) {
        await loadProducts();
        return;
    }

    try {
        const response = await api.searchProducts(searchTerm);
        const products = response.products;

        const productGrid = document.getElementById('productGrid');

        if (products.length === 0) {
            productGrid.innerHTML = '<div style="text-align: center; padding: 2rem;">No products found matching your search</div>';
            scrollToSection('products');
            return;
        }

        productGrid.innerHTML = products.map(product => `
            <div class="product-card">
                <div class="product-image">
                    <span style="font-size: 3rem;">${getProductEmoji(product.category_slug)}</span>
                    ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
                </div>
                <div class="product-content">
                    <div class="product-title">${product.product_name}</div>
                    <div class="product-price">$${product.price}</div>
                    <div class="product-rating">
                        <div class="stars">
                            ${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5 - Math.floor(product.rating))}
                        </div>
                        <span>(${product.rating})</span>
                    </div>
                    <button class="add-to-cart" onclick="addToCart(${product.product_id})">
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                </div>
            </div>
        `).join('');

        scrollToSection('products');
    } catch (error) {
        console.error('Error searching products:', error);
        const productGrid = document.getElementById('productGrid');
        productGrid.innerHTML =
            '<div style="text-align: center; padding: 2rem; color: red;">Failed to search products. Please try again later.</div>';
    }
}
// Replace the existing authentication functions in your Homepage.html with these:

// Handle User Signup
async function handleSignup(event) {
    event.preventDefault();
    
    const fullName = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
    if (!fullName || !email || !password || !confirmPassword) {
        showNotification('All fields are required', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }
    
    // Split full name into first and last name
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
    submitBtn.disabled = true;
    
    try {
        // Call API to register user
        const response = await api.register(firstName, lastName, email, password);
        
        // Close modal
        closeModal('signupModal');
        
        // Clear form
        document.getElementById('signupForm').reset();
        
        // Update UI to show logged in user
        showUserInfo(response.user);
        
        // Update cart count
        await updateCartCount();
        
        // Show success message
        showNotification(`Welcome to FootballZone, ${response.user.firstName}!`, 'success');
        
        // Reload products if needed
        if (typeof loadProducts === 'function') {
            await loadProducts();
        }
        
    } catch (error) {
        console.error('Signup error:', error);
        showNotification(error.message || 'Registration failed. Please try again.', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Handle User Login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    // Validation
    if (!email || !password) {
        showNotification('Email and password are required', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    submitBtn.disabled = true;
    
    try {
        // Call API to login user
        const response = await api.login(email, password);
        
        // Close modal
        closeModal('loginModal');
        
        // Clear form
        document.getElementById('loginForm').reset();
        
        // Update UI to show logged in user
        showUserInfo(response.user);
        
        // Update cart count
        await updateCartCount();
        
        // Show success message
        showNotification(`Welcome back, ${response.user.firstName}!`, 'success');
        
        // Reload products if needed
        if (typeof loadProducts === 'function') {
            await loadProducts();
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showNotification(error.message || 'Invalid email or password', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Handle Logout
function logout() {
    if (!confirm('Are you sure you want to logout?')) {
        return;
    }
    
    // Clear token from API client
    api.logout();
    
    // Update UI
    hideUserInfo();
    
    // Reset cart count
    document.getElementById('cartCount').textContent = '0';
    
    // Show notification
    showNotification('Logged out successfully', 'success');
    
    // Reload products if needed
    if (typeof loadProducts === 'function') {
        loadProducts();
    }
}

// Show user info in navbar
function showUserInfo(user) {
    const userInfo = document.getElementById('userInfo');
    const userWelcome = document.getElementById('userWelcome');
    const authButtons = document.getElementById('authButtons');
    
    if (userInfo && userWelcome && authButtons) {
        userWelcome.textContent = `Welcome, ${user.firstName}!`;
        userInfo.style.display = 'flex';
        authButtons.style.display = 'none';
    }
}

// Hide user info (show auth buttons)
function hideUserInfo() {
    const userInfo = document.getElementById('userInfo');
    const authButtons = document.getElementById('authButtons');
    
    if (userInfo && authButtons) {
        userInfo.style.display = 'none';
        authButtons.style.display = 'block';
    }
}

// Check if user is already logged in on page load
async function checkAuthStatus() {
    if (!api.token) {
        hideUserInfo();
        return;
    }
    
    try {
        const response = await api.getCurrentUser();
        showUserInfo(response.user);
        await updateCartCount();
    } catch (error) {
        // Token expired or invalid
        console.log('Token invalid, logging out');
        api.logout();
        hideUserInfo();
    }
}

// Update cart count
async function updateCartCount() {
    if (!api.token) {
        document.getElementById('cartCount').textContent = '0';
        return;
    }
    
    try {
        const response = await api.getCart();
        const count = response.items.reduce((total, item) => total + item.quantity, 0);
        document.getElementById('cartCount').textContent = count;
    } catch (error) {
        console.error('Error updating cart count:', error);
        document.getElementById('cartCount').textContent = '0';
    }
}

// Modal functions
function openLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function openSignupModal() {
    document.getElementById('signupModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function switchToSignup() {
    closeModal('loginModal');
    openSignupModal();
}

function switchToLogin() {
    closeModal('signupModal');
    openLoginModal();
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 3000;
        font-weight: bold;
        animation: slideInRight 0.3s ease-out;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    `;
    
    const icon = type === 'success' ? 
        '<i class="fas fa-check-circle"></i>' : 
        '<i class="fas fa-exclamation-circle"></i>';
    
    notification.innerHTML = `${icon} ${message}`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add CSS animations for notifications
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(styleSheet);

// Close modals when clicking outside
window.onclick = function(event) {
    const loginModal = document.getElementById('loginModal');
    const signupModal = document.getElementById('signupModal');
    
    if (event.target === loginModal) {
        closeModal('loginModal');
    }
    if (event.target === signupModal) {
        closeModal('signupModal');
    }
}

// Initialize authentication check on page load
document.addEventListener('DOMContentLoaded', async function() {
    console.log('FootballZone initialized with database connection');
    
    // Check if user is logged in
    await checkAuthStatus();
    
    // Load products if function exists
    if (typeof loadProducts === 'function') {
        await loadProducts();
    }
>>>>>>> 56654d77a2e0e4a2cbe667370edd1ce74ce7c789
});