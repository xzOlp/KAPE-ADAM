(function () {
  'use strict';

  const menuData = {
    hot: [
      { id: 'h1', name: 'Espresso',       desc: 'Rich, bold single shot \u2014 the foundation of everything we do.',                           price: 2.50, img: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=400&h=300&fit=crop' },
      { id: 'h2', name: 'Americano',      desc: 'Smooth and bold \u2014 espresso lengthened with hot water for a clean finish.',                price: 3.50, img: 'https://www.gourmetkava.cz/modules/ph_simpleblog/featured/82.jpg' },
      { id: 'h3', name: 'Cappuccino',     desc: 'Frothy espresso classic with equal parts coffee, steamed milk, and foam.',                     price: 4.50, img: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=400&h=300&fit=crop' },
      { id: 'h4', name: 'Flat White',     desc: 'Velvety smooth \u2014 double ristretto poured over micro-foamed milk.',                         price: 4.75, img: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=300&fit=crop' },
      { id: 'h5', name: 'Hot Chocolate',  desc: 'Decadent Belgian cocoa steamed with your choice of milk.',                                    price: 4.25, img: 'https://cdn.apartmenttherapy.info/image/upload/f_auto,q_auto:eco,c_fit,w_730,h_548/tk%2Fphoto%2F2025%2F12-2025%2F2025-12-homemade-hot-chocolate%2Fhomemade-hot-chocolate-284' },
      { id: 'h6', name: 'Chai Latte',     desc: 'Spiced black tea concentrate with steamed milk and a touch of honey.',                        price: 4.50, img: 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=400&h=300&fit=crop' },
    ],
    cold: [
      { id: 'c1', name: 'Iced Coffee',       desc: 'Chilled and refreshing \u2014 our house brew poured over ice.',                           price: 3.75, img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop' },
      { id: 'c2', name: 'Cold Brew',         desc: 'Slow-steeped 20 hours for a smooth, naturally sweet finish.',                             price: 4.50, img: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop', discount: '20% OFF' },
      { id: 'c3', name: 'Iced Latte',        desc: 'Classic cool \u2014 espresso over chilled milk poured over ice.',                          price: 4.75, img: 'https://www.cafedumonde.co.uk/media/o3gkzmuy/iced-latte.png?width=1440&height=1440&v=1dac1797980aad0' },
      { id: 'c4', name: 'Frappuccino',       desc: 'Blended delight \u2014 coffee, milk, and ice whipped into creamy perfection.',             price: 5.50, img: 'https://livinghealthywithchocolate.com/wp-content/uploads/2015/04/Healthy-Paleo-Starbucks-Mocha-Frappuccino-Recipe-dairyfree-glutenfree-sugarfree2.jpg' },
      { id: 'c5', name: 'Iced Matcha Latte', desc: 'Earthy and sweet \u2014 premium matcha whisked with chilled oat milk.',                    price: 5.25, img: 'https://images.unsplash.com/photo-1515823669307-9eca37fe6cf3?w=400&h=300&fit=crop' },
      { id: 'c6', name: 'Iced Tea',          desc: 'Crisp and cool \u2014 your choice of black, green, or hibiscus over ice.',                 price: 3.50, img: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400&h=300&fit=crop' },
    ],
    lattes: [
      { id: 'l1', name: 'Classic Latte',        desc: 'Silky espresso with steamed milk and a light layer of foam.',                          price: 4.75, img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop' },
      { id: 'l2', name: 'Vanilla Latte',        desc: 'Sweet Madagascar vanilla bean infused into our classic latte.',                         price: 5.25, img: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=400&h=300&fit=crop' },
      { id: 'l3', name: 'Caramel Latte',        desc: 'Buttery caramel sauce swirled through steamed milk and espresso.',                     price: 5.25, img: 'https://www.chilitochoc.com/wp-content/uploads/2022/12/homemade-caramel-latte.jpg' },
      { id: 'l4', name: 'Matcha Latte',         desc: 'Premium ceremonial-grade matcha with your choice of milk.',                            price: 5.50, img: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&h=300&fit=crop' },
      { id: 'l5', name: 'Lavender Latte',       desc: 'Floral and creamy \u2014 dried lavender buds steeped in oat milk.',                     price: 5.75, img: 'https://bitedive.com/wp-content/uploads/2026/04/Iced-Honey-Lavender-Latte-Recipe.jpg' },
      { id: 'l6', name: 'Honey Cinnamon Latte', desc: 'Warm and spiced \u2014 local honey and Ceylon cinnamon in every sip.',                  price: 5.50, img: 'https://elisetriestocook.com/wp-content/uploads/2023/08/honey-cinnamon-latte-close-up-final-image.jpg', discount: 'BOGO' },
      { id: 'l7', name: 'Seasonal Special',     desc: 'Ask your barista about this month\u2019s handcrafted creation.',                       price: 5.75, img: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&h=300&fit=crop' },
    ],
  };

  let cart = [];

  function getCart() { return cart; }

  function addToCart(itemId) {
    const allItems = [...menuData.hot, ...menuData.cold, ...menuData.lattes];
    const item = allItems.find(i => i.id === itemId);
    if (!item) return null;
    const existing = cart.find(i => i.id === itemId);
    if (existing) { existing.quantity += 1; }
    else { cart.push({ ...item, quantity: 1 }); }
    return item;
  }

  function removeFromCart(id) { cart = cart.filter(i => i.id !== id); }

  function updateQuantity(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) removeFromCart(id);
  }

  function clearCart() { cart = []; }

  function getCartCount() {
    return cart.reduce((sum, i) => sum + i.quantity, 0);
  }

  function renderMenu(data, gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = data.map(item => {
      const discountHtml = item.discount
        ? `<span class="discount-badge">${item.discount}</span>` : '';
      return `
        <div class="menu-card" data-id="${item.id}">
          <img class="menu-card-img" src="${item.img}" alt="${item.name}" loading="lazy" />
          <div class="menu-card-body">
            <div class="menu-card-header">
              <h3>${item.name}</h3>
              <span class="price">$${item.price.toFixed(2)}</span>
            </div>
            <p class="menu-card-desc">${item.desc}</p>
            <div class="menu-card-footer">
              ${discountHtml}
              <button class="add-to-cart" data-id="${item.id}">+ Add to Cart</button>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  function renderCart(cart, containerId, callbacks) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (cart.length === 0) {
      container.innerHTML = `
        <div class="cart-empty">
          <span class="cart-empty-icon">&#9749;</span>
          <h3>Your cart is empty</h3>
          <p>Looks like you haven&rsquo;t added anything yet. Browse our menu to find your perfect brew.</p>
          <button data-tab="lattes">Start Ordering</button>
        </div>`;
      return;
    }
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;
    const itemsHtml = cart.map(item => `
      <div class="cart-item">
        <img class="cart-item-img" src="${item.img}" alt="${item.name}" />
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <span class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
        <div class="cart-item-qty">
          <button class="qty-dec" data-id="${item.id}">&minus;</button>
          <span>${item.quantity}</span>
          <button class="qty-inc" data-id="${item.id}">+</button>
        </div>
        <button class="cart-item-remove" data-id="${item.id}">&times;</button>
      </div>`).join('');
    container.innerHTML = `
      ${itemsHtml}
      <div class="cart-summary">
        <div class="cart-summary-row"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
        <div class="cart-summary-row"><span>Tax (8%)</span><span>$${tax.toFixed(2)}</span></div>
        <div class="cart-summary-row total"><span>Total</span><span>$${total.toFixed(2)}</span></div>
        <button class="cart-checkout">Proceed to Checkout</button>
      </div>`;
    if (callbacks) {
      container.querySelectorAll('.qty-dec').forEach(btn =>
        btn.addEventListener('click', () => callbacks.onDecrement(btn.dataset.id)));
      container.querySelectorAll('.qty-inc').forEach(btn =>
        btn.addEventListener('click', () => callbacks.onIncrement(btn.dataset.id)));
      container.querySelectorAll('.cart-item-remove').forEach(btn =>
        btn.addEventListener('click', () => callbacks.onRemove(btn.dataset.id)));
    }
  }

  function showToast(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._toastTimer);
    el._toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  function createRipple(btn, e) {
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }

  function renderStatusFlow(container, currentStatus, options) {
    if (!container) return;
    const steps = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];
    const labels = ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Completed'];
    const currentIdx = steps.indexOf(currentStatus);
    const clickable = options && options.onStatusChange;
    const showMeta = options && options.meta;
    const isCancelled = currentStatus === 'cancelled';

    let html = '';
    if (isCancelled) {
      html = '<div class="sf-flow" style="opacity:0.6">';
      steps.forEach((step, i) => {
        const state = i < steps.length - 1 ? 'done' : 'cancelled';
        html += `<div class="sf-item ${state}" data-status="${step}">`;
        html += '<div class="sf-row">';
        html += `<div class="sf-circle ${state}">${i < steps.length - 1 ? '&#10003;' : '&#10007;'}</div>`;
        if (i < steps.length - 1) {
          const connState = i < steps.length - 2 ? 'done' : 'cancelled';
          html += `<div class="sf-connector ${connState}"></div>`;
        }
        html += '</div>';
        html += `<div class="sf-label">${labels[i]}</div>`;
        if (showMeta && options.meta[i]) {
          html += `<div class="sf-meta">${options.meta[i]}</div>`;
        }
        html += '</div>';
      });
      html += '</div>';
      html += '<div style="text-align:center;font-size:11px;font-weight:700;color:#c0392b;text-transform:uppercase;letter-spacing:1px;padding:4px 0 8px">Order Cancelled</div>';
    } else {
      html = '<div class="sf-flow">';
      steps.forEach((step, i) => {
        const state = i < currentIdx ? 'done' : i === currentIdx ? 'current' : 'future';
        const circleContent = state === 'done' ? '&#10003;' : (state === 'current' ? '' : '');
        html += `<div class="sf-item ${state}" data-status="${step}">`;
        html += '<div class="sf-row">';
        html += `<div class="sf-circle ${state}">${circleContent}</div>`;
        if (i < steps.length - 1) {
          html += `<div class="sf-connector ${state}"></div>`;
        }
        html += '</div>';
        html += `<div class="sf-label">${labels[i]}</div>`;
        if (showMeta && options.meta[i]) {
          html += `<div class="sf-meta">${options.meta[i]}</div>`;
        }
        html += '</div>';
      });
      html += '</div>';
    }

    container.innerHTML = html;

    if (clickable && !isCancelled) {
      container.querySelectorAll('.sf-item').forEach(el => {
        const status = el.dataset.status;
        el.style.cursor = 'pointer';
        el.addEventListener('click', function (e) {
          e.stopPropagation();
          options.onStatusChange(status);
        });
      });
    }
  }

  window.EmbOak = {
    menuData, getCart, addToCart, removeFromCart, updateQuantity, getCartCount, clearCart,
    renderMenu, renderCart, showToast, createRipple, renderStatusFlow,
  };
})();
