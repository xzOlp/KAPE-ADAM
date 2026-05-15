(function () {
  'use strict';

  const {
    menuData, getCart, addToCart, removeFromCart, updateQuantity, getCartCount, clearCart,
    renderMenu, renderCart, showToast, createRipple, renderStatusFlow,
  } = window.EmbOak;

  const {
    signUp, signIn, signOut, getSession, getUser, getProfile, saveOrder, getOrders, onAuthChange,
    subscribeOrders, unsubscribeOrders,
  } = window.EmbOakSupabase;

  const navBar        = document.getElementById('navbar');
  const navLinks      = document.getElementById('navLinks');
  const hamburger     = document.getElementById('hamburger');
  const cartCountEl   = document.getElementById('cartCount');
  const toastEl       = document.getElementById('toast');
  const tabsContainer = document.querySelector('.tabs-container');
  const overlay       = document.getElementById('loginOverlay');
  const loginError    = document.getElementById('loginError');
  const loginBtn      = document.getElementById('loginBtn');
  const loginToggle   = document.getElementById('loginToggle');
  const loginTitle    = document.getElementById('loginTitle');
  const loginSubtitle = document.getElementById('loginSubtitle');
  const loginEmail    = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const loginSkip     = document.getElementById('loginSkip');
  const navUser       = document.getElementById('navUser');
  const navUserEmail  = document.getElementById('navUserEmail');
  const navSignOut    = document.getElementById('navSignOut');
  const ordersCont    = document.getElementById('ordersContainer');

  const $$ = (sel) => document.querySelectorAll(sel);

  let currentTab = 'home';
  let currentUser = null;
  let isSignUp = false;
  let ordersPollTimer = null;
  let lastOrdersStatus = {};

  function updateUI() {
    const count = getCartCount();
    cartCountEl.textContent = count;
    cartCountEl.classList.toggle('visible', count > 0);
    renderCart(getCart(), 'cartContainer', {
      onIncrement: (id) => { updateQuantity(id, 1); updateUI(); },
      onDecrement: (id) => { updateQuantity(id, -1); updateUI(); },
      onRemove:    (id) => { removeFromCart(id); updateUI(); },
    });
  }

  function switchTab(tabId) {
    if (tabId === currentTab) return;
    currentTab = tabId;

    $$('.tab-content').forEach(el => el.classList.remove('active'));
    $$('[data-tab]').forEach(el => el.classList.remove('active'));

    const target = document.getElementById(tabId);
    if (target) {
      target.classList.add('active');
      target.style.animation = 'none';
      requestAnimationFrame(() => { target.style.animation = ''; });
    }

    document.querySelectorAll('[data-tab]').forEach(btn => {
      if (btn.dataset.tab === tabId) btn.classList.add('active');
    });

    navLinks.classList.remove('open');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (tabId === 'orders' && currentUser) {
      renderOrders(currentUser.id);
    }
  }

  function handleNavScroll() {
    navBar.classList.toggle('scrolled', window.scrollY > 10);
  }

  function handleAddToCartClick(e) {
    const btn = e.target.closest('.add-to-cart');
    if (!btn) return false;

    btn.classList.remove('pulse');
    void btn.offsetWidth;
    btn.classList.add('pulse');

    createRipple(btn, e);

    const item = addToCart(btn.dataset.id);
    if (item) showToast(toastEl, item.name + ' added to cart!');
    updateUI();
    return true;
  }

  function showLoginError(msg) {
    loginError.textContent = msg;
    loginError.style.display = msg ? 'block' : 'none';
  }

  function dismissOverlay() {
    overlay.classList.add('hidden');
  }

  function showOverlay() {
    overlay.classList.remove('hidden');
  }

  function setLoginMode(signUpMode) {
    isSignUp = signUpMode;
    loginTitle.textContent = signUpMode ? 'Create an Account' : 'Welcome to Ember & Oak';
    loginSubtitle.textContent = signUpMode ? 'Sign up to start ordering' : 'Sign in to explore our menu';
    loginBtn.textContent = signUpMode ? 'Sign Up' : 'Sign In';
    loginToggle.innerHTML = signUpMode
      ? 'Already have an account? <strong>Sign In</strong>'
      : 'Don\'t have an account? <strong>Sign Up</strong>';
    showLoginError('');
  }

  async function handleLogin() {
    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {
      showLoginError('Please enter email and password');
      return;
    }
    if (password.length < 6) {
      showLoginError('Password must be at least 6 characters');
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = 'Please wait...';
    showLoginError('');

    let result;
    if (isSignUp) {
      result = await signUp(email, password);
      if (result.error) {
        showLoginError(result.error.message || 'Sign up failed');
      } else {
        showToast(toastEl, 'Account created! Check your email to confirm.');
        setLoginMode(false);
      }
    } else {
      result = await signIn(email, password);
      if (result.error) {
        showLoginError(result.error.message || 'Sign in failed');
      } else {
        dismissOverlay();
      }
    }

    loginBtn.disabled = false;
    loginBtn.textContent = isSignUp ? 'Sign Up' : 'Sign In';
  }

  function stopOrdersPolling() {
    if (ordersPollTimer) { clearInterval(ordersPollTimer); ordersPollTimer = null; }
    lastOrdersStatus = {};
  }

  function startOrdersPolling(userId) {
    stopOrdersPolling();
    ordersPollTimer = setInterval(async () => {
      const { orders } = await getOrders(userId);
      if (!orders) return;
      let changed = false;
      orders.forEach(order => {
        const prev = lastOrdersStatus[order.id];
        if (prev && prev !== order.status) {
          changed = true;
          if (currentTab === 'orders') {
            renderOrders(userId);
          } else {
            showToast(toastEl, 'Order #' + order.id.slice(0, 8) + ' is now ' + order.status);
          }
        }
        lastOrdersStatus[order.id] = order.status;
      });
    }, 5000);
  }

  async function handleSignOut() {
    stopOrdersPolling();
    unsubscribeOrders();
    await signOut();
    currentUser = null;
    navUser.style.display = 'none';
    setLoginMode(false);
    showOverlay();
    switchTab('home');
    showToast(toastEl, 'Signed out successfully');
  }

  async function handleCheckout() {
    if (!currentUser) {
      showToast(toastEl, 'Please sign in to checkout');
      showOverlay();
      return;
    }
    const cart = getCart();
    if (cart.length === 0) {
      showToast(toastEl, 'Your cart is empty');
      return;
    }
    const checkoutBtn = document.querySelector('.cart-checkout');
    if (checkoutBtn) {
      checkoutBtn.disabled = true;
      checkoutBtn.textContent = 'Placing order...';
    }
    const result = await saveOrder(currentUser.id, cart);
    if (checkoutBtn) {
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = 'Proceed to Checkout';
    }
    if (result.error) {
      showToast(toastEl, 'Checkout failed: ' + result.error.message);
      return;
    }
    clearCart();
    updateUI();
    showToast(toastEl, 'Order placed! View it in My Orders.');
  }

  async function renderOrders(userId) {
    if (!ordersCont) return;
    ordersCont.innerHTML = '<p style="text-align:center;padding:40px;color:var(--text-light)">Loading orders...</p>';

    const { orders, error } = await getOrders(userId);

    if (error) {
      ordersCont.innerHTML = '<p style="text-align:center;padding:40px;color:var(--text-light)">Failed to load orders.</p>';
      return;
    }

    if (!orders || orders.length === 0) {
      ordersCont.innerHTML = `
        <div class="cart-empty">
          <span class="cart-empty-icon">&#128230;</span>
          <h3>No orders yet</h3>
          <p>You haven\'t placed any orders. Browse our menu and place your first order!</p>
          <button data-tab="lattes">Browse Menu</button>
        </div>`;
      return;
    }

    ordersCont.innerHTML = orders.map(order => {
      const items = order.items || [];
      const itemCount = items.length;
      const totalQty = items.reduce((s, i) => s + i.quantity, 0);
      const date = new Date(order.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });

      return `
        <div class="order-card" data-id="${order.id}">
          <div class="order-card-header">
            <div>
              <span class="order-id">Order #${order.id.slice(0, 8)}</span>
              <span class="order-date">${date}</span>
            </div>
            <span class="order-card-total-label">Total: $${parseFloat(order.total).toFixed(2)}</span>
          </div>
          <div class="sf-placeholder-${order.id.replace(/-/g, '')}"></div>
          <div class="order-card-items">${items.map(item => `
            <div class="order-item">
              <span class="order-item-name">${item.quantity}x ${item.name}</span>
              <span class="order-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
            </div>`).join('')}
          </div>
        </div>`;
    }).join('');

    orders.forEach(order => {
      const placeholder = document.querySelector(`.sf-placeholder-${order.id.replace(/-/g, '')}`);
      if (placeholder) {
        const items = order.items || [];
        const totalQty = items.reduce((s, i) => s + i.quantity, 0);
        renderStatusFlow(placeholder, order.status, {
          meta: ['', `$${parseFloat(order.total).toFixed(2)} ${totalQty} item${totalQty !== 1 ? 's' : ''}`, '', '', ''],
        });
      }
    });
  }

  /* ---- Auth init ---- */
  async function verifySession() {
    const { user, error } = await getUser();
    if (error || !user) {
      currentUser = null;
      navUser.style.display = 'none';
      setLoginMode(false);
      showOverlay();
      showToast(toastEl, 'Session expired — please sign in again');
      return false;
    }

    // Check if user's profile still exists (admin may have deleted it)
    const { data: profile } = await getProfile(user.id);
    if (!profile) {
      await signOut();
      currentUser = null;
      navUser.style.display = 'none';
      setLoginMode(false);
      showOverlay();
      showToast(toastEl, 'Your account has been removed. Please contact support.');
      return false;
    }

    currentUser = user;
    navUserEmail.textContent = user.email || 'User';
    navUser.style.display = 'flex';

    subscribeOrders(user.id, function onOrderUpdate(updatedOrder) {
      if (updatedOrder && updatedOrder.status !== 'pending') {
        showToast(toastEl, 'Order #' + updatedOrder.id.slice(0, 8) + ' is now ' + updatedOrder.status);
      }
      if (currentTab === 'orders') {
        renderOrders(currentUser.id);
      }
    });

    startOrdersPolling(user.id);

    return true;
  }

  async function initAuth() {
    overlay.classList.remove('loading');
    const { session } = await getSession();
    if (session) {
      currentUser = session.user;
      const ok = await verifySession();
      if (ok) dismissOverlay();
    } else {
      setLoginMode(false);
      showOverlay();
    }
  }

  let authChanging = false;
  onAuthChange(async (event, session) => {
    if (authChanging) return;
    authChanging = true;
    try {
      if (event === 'SIGNED_IN' && session) {
        currentUser = session.user;
        const ok = await verifySession();
        if (ok) dismissOverlay();
      } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        navUser.style.display = 'none';
        showOverlay();
      }
    } finally {
      authChanging = false;
    }
  });

  /* ---- Click handling ---- */
  function handleDocumentClick(e) {
    const target = e.target;
    const btn = target.closest('button');

    if (btn && btn.hasAttribute('data-tab') && !btn.matches('.nav-cart')) {
      if (btn.closest('#navLinks')) {
        switchTab(btn.dataset.tab);
        return;
      }
    }

    if (target.closest('.nav-cart')) {
      e.preventDefault();
      switchTab('cart');
      return;
    }

    if (target.closest('.nav-logo')) {
      switchTab('home');
      return;
    }

    if (btn && btn.id === 'navSignOut') {
      handleSignOut();
      return;
    }
  }

  function handleTabsClick(e) {
    const target = e.target;

    const tabBtn = target.closest('[data-tab]');
    if (tabBtn && !tabBtn.closest('.nav-cart')) {
      switchTab(tabBtn.dataset.tab);
      return;
    }

    if (handleAddToCartClick(e)) return;

    if (target.closest('.cart-checkout')) {
      e.preventDefault();
      handleCheckout();
      return;
    }
  }

  function handleOutsideClick(e) {
    if (navLinks.classList.contains('open') &&
        !e.target.closest('#navLinks') &&
        !e.target.closest('#hamburger')) {
      navLinks.classList.remove('open');
    }
  }

  /* ---- Register all listeners ---- */
  document.addEventListener('click', handleDocumentClick);
  tabsContainer.addEventListener('click', handleTabsClick);
  document.addEventListener('click', handleOutsideClick);
  hamburger.addEventListener('click', function () {
    navLinks.classList.toggle('open');
  });
  window.addEventListener('scroll', handleNavScroll, { passive: true });

  loginBtn.addEventListener('click', handleLogin);
  loginToggle.addEventListener('click', function () {
    setLoginMode(!isSignUp);
  });
  loginSkip.addEventListener('click', function () {
    if (!currentUser) {
      showToast(toastEl, 'Browse as guest — sign up anytime to save orders');
    }
    dismissOverlay();
  });
  navSignOut.addEventListener('click', handleSignOut);

  loginEmail.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') loginPassword.focus();
  });
  loginPassword.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') handleLogin();
  });

  handleNavScroll();

  const heroCta = document.querySelector('.hero-cta');
  if (heroCta) {
    heroCta.addEventListener('click', function () { switchTab('lattes'); });
  }

  renderMenu(menuData.hot, 'hotGrid');
  renderMenu(menuData.cold, 'coldGrid');
  renderMenu(menuData.lattes, 'lattesGrid');
  updateUI();

  initAuth();

  console.log('\u{1F332} Ember & Oak \u2014 Premium Coffee experience loaded.');
})();
