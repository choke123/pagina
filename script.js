document.addEventListener('DOMContentLoaded', function() {
    // 1. Definir todas las variables al inicio
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Elementos del carrito
    const cartOverlay = document.getElementById('cart-overlay');
    const cartContainer = document.querySelector('.cart-container');
    const cartIcon = document.getElementById('cart-icon');
    const closeCart = document.getElementById('close-cart');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    const continueBtn = document.querySelector('.continue-btn');
    const checkoutBtn = document.querySelector('.checkout-btn');
    
    // Elementos del checkout
    const checkoutForm = document.getElementById('checkout-form');
    const paymentContainer = document.getElementById('payment-container');
    const shippingForm = document.getElementById('shipping-form');
    const orderSummaryItems = document.getElementById('order-summary-items');
    const orderTotalElement = document.getElementById('order-total');

    // 2. Inicializar el carrusel (si es necesario)
    if (document.querySelector('.mySwiper')) {
        const swiper = new Swiper('.mySwiper', {
            loop: true,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
        });
    }

    // 3. Inicializar el carrito
    updateCart();

    // 4. Configurar event listeners
    function setupEventListeners() {
        // Carrito
        cartIcon.addEventListener('click', () => {
            cartOverlay.style.display = 'flex';
            showSection('cart');
        });
        
        closeCart.addEventListener('click', () => {
            cartOverlay.style.display = 'none';
        });
        
        continueBtn.addEventListener('click', () => {
            cartOverlay.style.display = 'none';
        });
        
        // Productos
        addToCartButtons.forEach(button => {
            button.addEventListener('click', () => {
                const id = button.getAttribute('data-id');
                const name = button.getAttribute('data-name');
                const price = parseInt(button.getAttribute('data-price'));
                const image = button.closest('.product-card').querySelector('img').src;
                
                addToCart(id, name, price, image);
            });
        });
        
        // Checkout
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                alert('Tu carrito está vacío');
            } else {
                showSection('checkout');
            }
        });
        
        // Formulario
        shippingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (validateCheckoutForm()) {
                saveShippingData();
                showSection('payment');
            }
        });
        
        // Navegación
        document.querySelectorAll('.back-to-cart').forEach(btn => {
            btn.addEventListener('click', () => showSection('cart'));
        });
        
        document.querySelectorAll('.back-to-checkout').forEach(btn => {
            btn.addEventListener('click', () => showSection('checkout'));
        });
        
        // Delegación de eventos para botones de cantidad
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('decrease-quantity')) {
                updateQuantity(e.target.dataset.id, -1);
            } else if (e.target.classList.contains('increase-quantity')) {
                updateQuantity(e.target.dataset.id, 1);
            } else if (e.target.classList.contains('remove-item')) {
                removeItem(e.target.dataset.id);
            }
        });
    }

    // 5. Funciones del carrito
    function addToCart(id, name, price, image) {
        const existingItem = cart.find(item => item.id === id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id,
                name,
                price,
                image,
                quantity: 1
            });
        }
        
        updateCart();
        
        // Animación del botón
        const button = document.querySelector(`.add-to-cart[data-id="${id}"]`);
        if (button) {
            button.textContent = '✓ Añadido';
            button.style.backgroundColor = '#28a745';
            
            setTimeout(() => {
                button.textContent = 'Añadir al carrito';
                button.style.backgroundColor = '#333';
            }, 2000);
        }
    }

    function updateCart() {
    // Verificar nuevamente que el carrito sea válido
    if (!Array.isArray(cart)) {
        console.error('Carrito no es un array, reiniciando');
        cart = [];
    }

    // Actualizar contador
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        cartCount.textContent = cart.reduce((total, item) => {
            // Verificar que el item tenga cantidad
            const qty = Number.isInteger(item.quantity) ? item.quantity : 0;
            return total + qty;
        }, 0);
    }
    
    // Actualizar vista del carrito
    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = '';
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart-message">Tu carrito está vacío</p>';
            if (cartTotal) cartTotal.textContent = '$0';
            if (checkoutBtn) checkoutBtn.style.display = 'none';
        } else {
            let total = 0;
            let hasInvalidItems = false;
            
            cart.forEach(item => {
                // Validar cada item
                if (!item.id || !item.name || !item.price || !item.quantity || !item.image) {
                    console.error('Item inválido en el carrito:', item);
                    hasInvalidItems = true;
                    return;
                }
                
                const cartItemElement = document.createElement('div');
                cartItemElement.classList.add('cart-item');
                cartItemElement.innerHTML = `
                    <img src="${item.image}" alt="${item.name}">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p class="cart-item-price">$${(item.price * item.quantity).toLocaleString()}</p>
                        <div class="cart-item-quantity">
                            <button class="decrease-quantity" data-id="${item.id}">-</button>
                            <span>${item.quantity}</span>
                            <button class="increase-quantity" data-id="${item.id}">+</button>
                        </div>
                        <p class="remove-item" data-id="${item.id}">Eliminar</p>
                    </div>
                `;
                cartItemsContainer.appendChild(cartItemElement);
                total += item.price * item.quantity;
            });
            
            if (hasInvalidItems) {
                // Limpiar el carrito si hay items inválidos
                clearInvalidCart();
                return;
            }
            
            if (cartTotal) cartTotal.textContent = `$${total.toLocaleString()}`;
            if (checkoutBtn) checkoutBtn.style.display = 'block';
        }
    }
    
    // Guardar solo si es válido
    if (Array.isArray(cart)) {
        localStorage.setItem('cart', JSON.stringify(cart));
    } else {
        localStorage.removeItem('cart');
    }
}

    function updateQuantity(id, change) {
        const itemIndex = cart.findIndex(item => item.id === id);
        
        if (itemIndex !== -1) {
            cart[itemIndex].quantity += change;
            
            if (cart[itemIndex].quantity <= 0) {
                cart.splice(itemIndex, 1);
            }
            
            updateCart();
        }
    }

    function removeItem(id) {
        cart = cart.filter(item => item.id !== id);
        updateCart();
    }

    // 6. Funciones del checkout
    function showSection(section) {
        if (cartContainer) cartContainer.style.display = section === 'cart' ? 'block' : 'none';
        if (checkoutForm) checkoutForm.style.display = section === 'checkout' ? 'block' : 'none';
        if (paymentContainer) paymentContainer.style.display = section === 'payment' ? 'block' : 'none';
        
        if (section === 'payment') {
            updateOrderSummary();
            initializePaymentGateway();
        }
    }

    function validateCheckoutForm() {
        let isValid = true;
        const requiredFields = shippingForm.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            field.classList.remove('error');
            if (!field.value.trim()) {
                field.classList.add('error');
                isValid = false;
            }
        });
        
        const email = document.getElementById('email')?.value;
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            document.getElementById('email').classList.add('error');
            isValid = false;
            alert('Por favor ingresa un correo electrónico válido');
        }
        
        const phone = document.getElementById('phone')?.value;
        if (phone && !/^[0-9]{10}$/.test(phone)) {
            document.getElementById('phone').classList.add('error');
            isValid = false;
            alert('El teléfono debe tener 10 dígitos');
        }
        
        if (!isValid) {
            alert('Por favor completa todos los campos requeridos');
        }
        
        return isValid;
    }

    function saveShippingData() {
        const shippingData = {
            name: document.getElementById('full-name')?.value,
            email: document.getElementById('email')?.value,
            phone: document.getElementById('phone')?.value,
            address: document.getElementById('address')?.value,
            city: document.getElementById('city')?.value,
            state: document.getElementById('state')?.value,
            zip: document.getElementById('zip-code')?.value,
            country: document.getElementById('country')?.value
        };
        
        localStorage.setItem('shippingData', JSON.stringify(shippingData));
    }

    function updateOrderSummary() {
        if (orderSummaryItems) {
            orderSummaryItems.innerHTML = '';
            
            cart.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'order-item';
                itemElement.innerHTML = `
                    <p>${item.name} x ${item.quantity}</p>
                    <p>$${(item.price * item.quantity).toLocaleString()}</p>
                `;
                orderSummaryItems.appendChild(itemElement);
            });
        }
        
        if (orderTotalElement) {
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            orderTotalElement.textContent = `$${total.toLocaleString()}`;
        }
    }

    function initializePaymentGateway() {
        const paymentButtonContainer = document.getElementById('mercadopago-button');
        if (!paymentButtonContainer) return;
        
        paymentButtonContainer.innerHTML = '';
        
        const mp = new MercadoPago('TU_PUBLIC_KEY', { locale: 'es-CO' });
        const shippingData = JSON.parse(localStorage.getItem('shippingData')) || {};
        
        mp.checkout({
            preference: {
                items: cart.map(item => ({
                    title: item.name,
                    unit_price: item.price,
                    quantity: item.quantity
                })),
                payer: {
                    name: shippingData.name,
                    email: shippingData.email,
                    phone: { number: shippingData.phone },
                    address: {
                        street_name: shippingData.address,
                        zip_code: shippingData.zip,
                        city: shippingData.city,
                        federal_unit: shippingData.state
                    }
                },
                back_urls: {
                    success: window.location.href + '?payment=success',
                    failure: window.location.href + '?payment=failure',
                    pending: window.location.href + '?payment=pending'
                },
                auto_return: 'approved'
            },
            render: {
                container: '#mercadopago-button',
                label: 'Pagar Ahora'
            }
        });
    }

    // Iniciar la configuración
    setupEventListeners();
});