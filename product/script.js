document.addEventListener('DOMContentLoaded', function() {
  feather.replace();

  const API_URL = "https://script.google.com/macros/s/AKfycbw7qgvPNeLw7B3HBcmTMN6UmInfgdn9ETt4McnT6p8U1muXtLg_YjfHAoOQCsM_4vlY/exec";

  let cart = [];

  const formatCurrency = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(number);
  };

  function disableProduct(productName) {
    const card = document.querySelector('.product-card[data-name="' + productName + '"]');
    if (!card) return;
    const btn = card.querySelector('.add-to-cart-btn');
    if (!btn) return;
    btn.disabled = true;
    btn.classList.add('opacity-50', 'cursor-not-allowed', 'bg-gray-300');
    btn.classList.remove('bg-primary');
    btn.textContent = 'Sold Out';
  }

  async function checkStock() {
    try {
      const res = await fetch(API_URL + '?action=stock');
      if (!res.ok) return;
      const data = await res.json();
      if (!data || !data.success) return;

      const googleStatus = String(data.googleUltraStatus || '').toLowerCase();
      const fireflyStatus = String(data.fireflyStatus || '').toLowerCase();

      if (googleStatus === 'sold out') {
        disableProduct('Google Ultra');
      }
      if (fireflyStatus === 'sold out') {
        disableProduct('Firefly');
      }
    } catch (err) {
      console.error('Stock check error', err);
    }
  }

  document.querySelectorAll('.quantity-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const span = this.parentElement.querySelector('.quantity');
      let currentVal = parseInt(span.textContent);
      if (this.classList.contains('increase')) {
        span.textContent = currentVal + 1;
      } else if (this.classList.contains('decrease') && currentVal > 1) {
        span.textContent = currentVal - 1;
      }
    });
  });

  document.querySelectorAll('.more-info-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const container = this.closest('.product-card').querySelector('.product-details-container');
      const icon = this.querySelector('i');
      const isOpen = container.classList.contains('open');
      if (isOpen) {
        container.classList.remove('open');
        this.classList.remove('active');
        icon.style.transform = 'rotate(0deg)';
        this.querySelector('span').textContent = 'Details';
      } else {
        container.classList.add('open');
        this.classList.add('active');
        icon.style.transform = 'rotate(180deg)';
        this.querySelector('span').textContent = 'Hide';
      }
    });
  });

  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      if (this.disabled) return;
      const card = this.closest('.product-card');
      const name = card.dataset.name;
      const price = parseInt(card.dataset.price);
      const quantity = parseInt(card.querySelector('.quantity').textContent);
      const existingItem = cart.find(item => item.name === name);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.push({ name, price, quantity });
      }
      updateGlobalState();
      const originalText = this.textContent;
      this.textContent = 'Added';
      this.classList.remove('bg-primary');
      this.classList.add('bg-secondary');
      setTimeout(() => {
        if (this.disabled) return;
        this.textContent = originalText;
        this.classList.remove('bg-secondary');
        this.classList.add('bg-primary');
      }, 1500);
    });
  });

  function updateGlobalState() {
    let totalItems = 0;
    let totalPrice = 0;
    cart.forEach(item => {
      totalItems += item.quantity;
      totalPrice += item.price * item.quantity;
    });
    const formattedPrice = formatCurrency(totalPrice);
    document.querySelector('.total-items').textContent = totalItems;
    document.querySelector('.total-price').textContent = formattedPrice;
    const badge = document.querySelector('.cart-count');
    badge.textContent = totalItems;
    if (totalItems > 0) {
      badge.classList.add('active');
    } else {
      badge.classList.remove('active');
    }
    document.querySelector('.cart-total-display').textContent = formattedPrice;
    renderCartDropdown();
  }

  const cartBtn = document.getElementById('cart-icon-btn');
  const cartDropdown = document.getElementById('cart-dropdown');
  const cartItemsContainer = document.getElementById('cart-dropdown-items');

  function renderCartDropdown() {
    if (cart.length === 0) {
      cartItemsContainer.innerHTML = '<div class="text-center py-6"><i data-feather="shopping-cart" class="mx-auto text-gray-300 w-8 h-8 mb-2"></i><p class="text-gray-400 text-sm">Cart is empty</p></div>';
      feather.replace();
      return;
    }
    let html = '';
    cart.forEach((item, index) => {
      html += '<div class="flex justify-between items-center group"><div><h5 class="text-sm font-semibold text-gray-800">' + item.name + '</h5><p class="text-xs text-gray-500">' + item.quantity + ' x ' + formatCurrency(item.price) + '</p></div><div class="flex items-center gap-3"><span class="text-sm font-medium text-primary">' + formatCurrency(item.price * item.quantity) + '</span><button onclick="removeItem(' + index + ')" class="text-gray-300 hover:text-red-500 transition"><i data-feather="trash-2" class="w-4 h-4"></i></button></div></div>';
    });
    cartItemsContainer.innerHTML = html;
    feather.replace();
  }

  window.removeItem = function(index) {
    cart.splice(index, 1);
    updateGlobalState();
  };

  cartBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = cartDropdown.classList.contains('hidden');
    if (isHidden) {
      cartDropdown.classList.remove('hidden');
      setTimeout(() => {
        cartDropdown.classList.remove('opacity-0', 'translate-y-2');
      }, 10);
    } else {
      closeDropdown();
    }
  });

  function closeDropdown() {
    cartDropdown.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => {
      cartDropdown.classList.add('hidden');
    }, 200);
  }

  document.addEventListener('click', (e) => {
    if (!cartDropdown.contains(e.target) && !cartBtn.contains(e.target)) {
      closeDropdown();
    }
  });

  const checkoutBtn = document.getElementById('checkout-trigger-btn');
  const modal = document.getElementById('checkout-modal');
  const closeCheckoutBtn = document.getElementById('close-checkout');
  const modalBackdrop = document.getElementById('modal-backdrop');
  const checkoutList = document.getElementById('checkout-list');
  const paymentBtn = document.getElementById('confirm-payment');
  const clientName = document.getElementById('client-name');
  const clientPhone = document.getElementById('client-phone');
  const clientEmail = document.getElementById('client-email');
  const clientID = document.getElementById('client-id');

  const touched = {
    clientName: false,
    clientPhone: false,
    clientEmail: false,
    clientID: false
  };

  function isPhoneValid(phone) {
    return /^[0-9]+$/.test(phone);
  }

  function isEmailValid(email) {
    return /^[^\s@]+@gmail\.com$/.test(email);
  }

  function validateClientForm() {
    const nameVal = clientName.value.trim();
    const phoneVal = clientPhone.value.trim();
    const emailVal = clientEmail.value.trim();
    const idVal = clientID.value.trim();

    const isNameValid = nameVal !== '';
    const isPhoneValidInput = isPhoneValid(phoneVal);
    const isEmailValidInput = isEmailValid(emailVal);
    const isIDValid = idVal !== '';

    toggleError(clientName, isNameValid);
    toggleError(clientPhone, isPhoneValidInput);
    toggleError(clientEmail, isEmailValidInput);
    toggleError(clientID, isIDValid);

    if (isNameValid && isPhoneValidInput && isEmailValidInput && isIDValid) {
      paymentBtn.disabled = false;
      paymentBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
      paymentBtn.disabled = true;
      paymentBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
  }

  function toggleError(element, isInvalid) {
    if (isInvalid) {
      element.classList.add('input-error');
    } else {
      element.classList.remove('input-error');
    }
  }

  clientName.addEventListener('input', () => {
    touched.clientName = true;
    validateClientForm();
  });

  clientPhone.addEventListener('input', (e) => {
    touched.clientPhone = true;
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
    validateClientForm();
  });

  clientEmail.addEventListener('input', () => {
    touched.clientEmail = true;
    validateClientForm();
  });

  clientID.addEventListener('input', () => {
    touched.clientID = true;
    validateClientForm();
  });

  validateClientForm();

  checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
      alert('Your cart is empty. Please add items before checking out.');
      return;
    }
    renderCheckoutList();
    modal.classList.remove('hidden');
    validateClientForm();
  });

  function renderCheckoutList() {
    let html = '';
    let total = 0;
    cart.forEach(item => {
      const subtotal = item.price * item.quantity;
      total += subtotal;
      html += '<div class="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"><div class="flex items-center gap-4"><div class="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400"><i data-feather="box" class="w-5 h-5"></i></div><div><h4 class="font-bold text-gray-800">' + item.name + '</h4><p class="text-sm text-gray-500">Qty: ' + item.quantity + ' x ' + formatCurrency(item.price) + '</p></div></div><span class="font-bold text-gray-800">' + formatCurrency(subtotal) + '</span></div>';
    });
    checkoutList.innerHTML = html;
    document.getElementById('checkout-subtotal').textContent = formatCurrency(total);
    document.getElementById('checkout-total').textContent = formatCurrency(total);
    feather.replace();
  }

  function closeModal() {
    modal.classList.add('hidden');
  }

  closeCheckoutBtn.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', closeModal);

  paymentBtn.addEventListener('click', async function() {
    const btn = this;
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<i class="animate-spin" data-feather="loader"></i> Processing...';
    feather.replace();
    btn.disabled = true;
    btn.classList.add('opacity-75');

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (totalAmount <= 0) {
      alert('Your cart is empty or total amount is invalid.');
      btn.innerHTML = originalContent;
      btn.disabled = false;
      btn.classList.remove('opacity-75');
      feather.replace();
      return;
    }

    const payload = {
      order_id: 'ORDER-' + Date.now(),
      gross_amount: totalAmount,
      customer_details: {
        first_name: clientName.value.trim(),
        email: clientEmail.value.trim(),
        phone: clientPhone.value.trim()
      },
      item_details: cart.map((item, i) => ({
        id: 'ITEM' + (i + 1),
        price: item.price,
        quantity: item.quantity,
        name: item.name
      }))
    };

    try {
      const response = await fetch('https://midtrans-backend-prbh.onrender.com/create-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Network error: ' + response.status);
      }

      const data = await response.json();

      if (!data.token) {
        throw new Error('Token not received from server');
      }

      if (!window.snap || !window.snap.pay) {
        throw new Error('Midtrans Snap is not loaded');
      }

      window.snap.pay(data.token, {
        onSuccess: function(result) {
          const params = new URLSearchParams({
            feedioId: clientID.value.trim(),
            phone: clientPhone.value.trim(),
            name: clientName.value.trim(),
            orderId: payload.order_id,
            amount: payload.gross_amount
          });

          cart = [];
          updateGlobalState();
          closeModal();

          window.location.href = 'verifed.html?' + params.toString();
        },
        onPending: function(result) {
          alert('Payment pending. Please complete the payment.');
        },
        onError: function(result) {
          alert('Payment failed. Please try again.');
        },
        onClose: function() {
        }
      });
    } catch (err) {
      console.error(err);
      alert('Error processing payment: ' + err.message);
    } finally {
      btn.innerHTML = originalContent;
      btn.disabled = false;
      btn.classList.remove('opacity-75');
      feather.replace();
    }
  });

  checkStock();
});
