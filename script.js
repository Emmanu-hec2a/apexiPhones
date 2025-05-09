// Mobile navigation toggle
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        this.textContent = navLinks.classList.contains('active') ? '✕' : '☰';
    });
}

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    document.getElementById("datetime").textContent = formattedDate;

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Close mobile menu if open
        if (navLinks && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            mobileMenuBtn.textContent = '☰';
        }
        
        // smooth scroll for back-to-top button (it has its own handler)
        if (this.id === 'back-to-top') return;
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 60,
                behavior: 'smooth'
            });
        }
    });
});

// Toggle Order History Button
const toggleOrders = document.getElementById("toggleOrders");
if (toggleOrders) {
    toggleOrders.addEventListener("click", function() {
        var orderHistory = document.getElementById("orderHistory");
        if (orderHistory.style.display === "none" || orderHistory.style.display === "") {
            orderHistory.style.display = "block";
            this.textContent = "Hide Order History";
        } else {
            orderHistory.style.display = "none";
            this.textContent = "View Order History";
        }
    });
}

// Order History Button for API fetch
// Cart Handling with PayPal Integration
document.addEventListener("DOMContentLoaded", () => {
    // Get cart elements
    const cartItemsContainer = document.querySelector(".cart-items");
    const cartSummary = document.querySelector(".cart-summary");
    const cartCounter = document.getElementById("cart-counter");
    
    // Initialize cart from localStorage if available
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Products data
    const products = {
        "i15PrMx": { name: "iPhone 15 Pro Max", price: 899.99, image: "/assets/images/15PrMax.jpg", description: "Featuring A17 Pro chip, Dynamic Island" },
        "chickenBurger": { name: "iPhone 15 Pro", price: 799.99, image: "/assets/images/15Pr.jpeg", description: "Powered by A16 Bionic chip" },
        "caesarSalad": { name: "iPhone 14 Pro Max", price: 699.99, image: "/assets/images/i14PrMx.jpg", description: "Large 6.7-inch display with ProMotion" },
        "pastaCarbonara": { name: "iPhone 16", price: 999.99, image: "/assets/images/i16.jpeg", description: "Compact powerhouse with A15 Bionic chip" },
    };

    // Add product to cart
    function addToCart(productId) {
        const product = products[productId];
        if (!product) {
            console.error(`Product with ID ${productId} not found`);
            return;
        }

        let cartItem = cart.find(item => item.id === productId);
        if (cartItem) {
            cartItem.quantity += 1;
        } else {
            cart.push({ 
                id: productId, 
                name: product.name, 
                price: product.price, 
                image: product.image, 
                description: product.description, 
                quantity: 1 
            });
        }
        
        // Save cart to localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Update UI
        updateCartUI();
        
        // Show confirmation notification
        showNotification(`Added ${product.name} to cart`);
    }

    // Update cart UI
    function updateCartUI() {
        if (!cartItemsContainer || !cartSummary) {
            console.error("Cart elements not found in the DOM");
            return;
        }

        cartItemsContainer.innerHTML = ""; // Clear cart UI

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
            if (cartSummary) cartSummary.style.display = "none";
            if (cartCounter) cartCounter.textContent = "0";
            return;
        }

        if (cartSummary) cartSummary.style.display = "block";
        let subtotal = 0;
        let totalItems = 0;

        cart.forEach((item, index) => {
            const itemTotal = (item.price * item.quantity).toFixed(2);
            subtotal += parseFloat(itemTotal);
            totalItems += item.quantity;

            const cartItemHTML = `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <img src="${item.image}" alt="${item.name}">
                        <div class="cart-item-details">
                            <h4>${item.name}</h4>
                            <p>${item.description}</p>
                        </div>
                    </div>
                    <div class="quantity-control">
                        <button class="quantity-btn decrease" data-index="${index}">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn increase" data-index="${index}">+</button>
                    </div>
                    <span class="cart-item-price">£${itemTotal}</span>
                    <button class="remove-btn" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            cartItemsContainer.innerHTML += cartItemHTML;
        });

        updateCartSummary(subtotal);
        updateCartCounter(totalItems);
        attachEventListeners();
    }

    // Update cart summary
    function updateCartSummary(subtotal) {
        if (!cartSummary) return;
        
        const deliveryFee = cart.length > 0 ? 3.99 : 0;
        const total = (subtotal + deliveryFee).toFixed(2);

        cartSummary.innerHTML = `
            <div class="summary-row">
                <span>Subtotal</span>
                <span>£${subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-row">
                <span>Delivery Fee</span>
                <span>£${deliveryFee.toFixed(2)}</span>
            </div>
            <div class="summary-row total">
                <span>Total</span>
                <span>£${total}</span>
            </div>
            <div id="paypal-button-container"></div>
        `;
        
        // Initialize PayPal buttons
        if (cart.length > 0) {
            initializePayPalButton(parseFloat(total));
        }
    }

    // Update cart counter
    function updateCartCounter(count) {
        if (cartCounter) {
            cartCounter.textContent = count;
            
            // Add animation effect
            cartCounter.classList.add("bump");
            setTimeout(() => {
                cartCounter.classList.remove("bump");
            }, 300);
        }
    }

    // Initialize PayPal Smart Button
    function initializePayPalButton(totalAmount) {
        if (!window.paypal) {
            console.error("PayPal SDK not loaded!");
            const paypalButtonContainer = document.getElementById('paypal-button-container');
            if (paypalButtonContainer) {
                paypalButtonContainer.innerHTML = `
                    <button class="checkout-btn" id="paypal-checkout">Proceed to Checkout</button>
                `;
                document.getElementById("paypal-checkout").addEventListener("click", function() {
                    showNotification("PayPal SDK not loaded. Please try again later.", "error");
                });
            }
            return;
        }

        // Clear existing buttons first
        document.getElementById('paypal-button-container').innerHTML = '';
        
        // Create order items for PayPal
        const items = cart.map(item => ({
            name: item.name,
            unit_amount: {
                currency_code: 'GBP',
                value: item.price.toFixed(2)
            },
            quantity: item.quantity,
            category: 'DIGITAL_GOODS'
        }));

        paypal.Buttons({
            // Set up the transaction
            createOrder: function(data, actions) {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            currency_code: 'GBP',
                            value: totalAmount,
                            breakdown: {
                                item_total: {
                                    currency_code: 'GBP',
                                    value: (totalAmount - 3.99).toFixed(2)
                                },
                                shipping: {
                                    currency_code: 'GBP',
                                    value: '3.99'
                                }
                            }
                        },
                        items: items
                    }]
                });
            },
            
            // Finalize the transaction
            onApprove: function(data, actions) {
                return actions.order.capture().then(function(orderData) {
                    // Successful capture! Process order
                    const transaction = orderData.purchase_units[0].payments.captures[0];
                    
                    if (transaction.status === 'COMPLETED') {
                        // Save order to database (through API)
                        saveOrderToDatabase(orderData)
                            .then(response => {
                                // Show success message
                                showNotification(`Payment successful! Transaction ID: ${transaction.id}`, "success");
                                
                                // Clear cart
                                cart = [];
                                localStorage.removeItem('cart');
                                updateCartUI();
                                
                                // Redirect to order confirmation page
                                setTimeout(() => {
                                    window.location.href = `/order-confirmation?order_id=${response.orderId}`;
                                }, 2000);
                            })
                            .catch(error => {
                                console.error("Error saving order:", error);
                                showNotification("Payment completed, but there was an issue saving your order. Please contact support.", "error");
                            });
                    } else {
                        showNotification(`Payment status: ${transaction.status}. Please contact support.`, "error");
                    }
                });
            },
            
            onError: function(err) {
                console.error('PayPal Error:', err);
                showNotification("Payment failed. Please try again or use a different payment method.", "error");
            }
        }).render('#paypal-button-container');
    }

    // Save order to database via API
    async function saveOrderToDatabase(orderData) {
        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    paypalOrderId: orderData.id,
                    items: cart.map(item => ({
                        productId: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity
                    })),
                    totalAmount: orderData.purchase_units[0].amount.value,
                    customerDetails: {
                        name: orderData.payer.name.given_name + ' ' + orderData.payer.name.surname,
                        email: orderData.payer.email_address
                    },
                    status: 'COMPLETED',
                    paymentDetails: {
                        transactionId: orderData.purchase_units[0].payments.captures[0].id,
                        method: 'PayPal'
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to save order');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error saving order:', error);
            throw error;
        }
    }

    // Email validation function
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }

    // Show notification
    function showNotification(message, type = "success") {
        // Create notification element
        const notification = document.createElement("div");
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add to body
        document.body.appendChild(notification);
        
        // Show and then hide after 3 seconds
        setTimeout(() => {
            notification.classList.add("show");
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove("show");
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    // Attach event listeners for cart item controls
    function attachEventListeners() {
        // Increase quantity buttons
        document.querySelectorAll(".quantity-btn.increase").forEach(button => {
            button.addEventListener("click", (event) => {
                const index = parseInt(event.target.dataset.index);
                cart[index].quantity += 1;
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartUI();
            });
        });

        // Decrease quantity buttons
        document.querySelectorAll(".quantity-btn.decrease").forEach(button => {
            button.addEventListener("click", (event) => {
                const index = parseInt(event.target.dataset.index);
                if (cart[index].quantity > 1) {
                    cart[index].quantity -= 1;
                } else {
                    cart.splice(index, 1);
                }
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartUI();
            });
        });

        // Remove buttons
        document.querySelectorAll(".remove-btn").forEach(button => {
            button.addEventListener("click", (event) => {
                // Check if click was on the icon or the button itself
                const target = event.target.closest('.remove-btn');
                if (!target) return;
                
                const index = parseInt(target.dataset.index);
                if (isNaN(index)) return;
                
                const removedItem = cart[index];
                cart.splice(index, 1);
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartUI();
                
                if (removedItem) {
                    showNotification(`Removed ${removedItem.name} from cart`);
                }
            });
        });
    }

    // Attach add to cart button listeners
    function setupAddToCartButtons() {
        const addToCartButtons = document.querySelectorAll(".add-to-cart-btn");
        
        addToCartButtons.forEach(button => {
            button.addEventListener("click", function() {
                const productId = this.getAttribute("data-product-id");
                addToCart(productId);
            });
        });
    }
    
    // Initialize cart UI and buttons
    setupAddToCartButtons();
    updateCartUI();
    
    // Add notification styles
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background-color: #4CAF50;
            color: white;
            border-radius: 4px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.2);
            transform: translateX(120%);
            transition: transform 0.3s ease;
            z-index: 1000;
        }
        
        .notification.error {
            background-color: #f44336;
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        #cart-counter.bump {
            animation: bump 0.3s ease;
        }
        
        @keyframes bump {
            0% { transform: scale(1); }
            50% { transform: scale(1.3); }
            100% { transform: scale(1); }
        }
        
        #paypal-button-container {
            margin-top: 15px;
        }
    `;
    document.head.appendChild(style);
});