(function () {
  'use strict';

  const SUPABASE_URL = 'https://uqvayowsuyrkqcdmdfnw.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdmF5b3dzdXlya3FjZG1kZm53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MDA1NzksImV4cCI6MjA5NDM3NjU3OX0.Jfx7QM8yCD9TBw0KFl91jLFGUWIU17F5R7z2bAAW6Lk';

  const { createClient } = window.supabase;
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const usersBody  = document.getElementById('usersBody');
  const ordersBody = document.getElementById('ordersBody');
  const itemsBody  = document.getElementById('itemsBody');

  const usersCount  = document.getElementById('usersCount');
  const ordersCount = document.getElementById('ordersCount');
  const itemsCount  = document.getElementById('itemsCount');

  let profilesCache = {};

  function showAdminError(msg) {
    const err = document.getElementById('gateError');
    err.style.display = msg ? 'block' : 'none';
    err.textContent = msg;
  }

  function toast(msg) {
    let el = document.querySelector('.admin-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'admin-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 2200);
  }

  async function fetchProfiles() {
    const { data } = await supabase.from('profiles').select('id, email');
    if (data) {
      data.forEach(p => { profilesCache[p.id] = p.email; });
    }
    return data || [];
  }

  function getEmail(userId) {
    return profilesCache[userId] || userId.slice(0, 8) + '...';
  }

  /* ---- Tab switching ---- */
  document.querySelectorAll('.admin-tab').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-content').forEach(s => s.classList.remove('active'));
      this.classList.add('active');
      document.getElementById(this.dataset.tab).classList.add('active');
    });
  });

  function unlock() {
    sessionStorage.setItem('admin_unlocked', '1');
    document.getElementById('adminGate').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    showAdminError('');
    loadData();
  }

  function lock() {
    sessionStorage.removeItem('admin_unlocked');
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('adminGate').style.display = 'flex';
    document.getElementById('gatePassword').value = '';
    showAdminError('');
  }

  /* ---- Role-based gate ---- */
  async function tryAutoAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle();

    if (profile && profile.role === 'admin') {
      return true;
    }
    return false;
  }

  async function initGate() {
    if (sessionStorage.getItem('admin_unlocked')) {
      unlock();
      return;
    }

    const ok = await tryAutoAuth();
    if (ok) {
      unlock();
      return;
    }

    const btn = document.getElementById('gateBtn');
    const pass = document.getElementById('gatePassword');

    btn.addEventListener('click', async function () {
      if (!pass.value) { showAdminError('Enter password'); return; }

      const authed = await tryAutoAuth();
      if (authed) { unlock(); return; }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showAdminError('Sign in as an admin on the main site first');
        return;
      }
      showAdminError('Your account does not have admin privileges');
    });

    pass.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') btn.click();
    });

    document.getElementById('adminLockBtn').addEventListener('click', lock);
  }

  initGate();

  /* ---- Loading helpers ---- */
  function setLoading(el, loading) {
    if (!el) return;
    el.innerHTML = loading
      ? '<div class="empty-state"><p>Loading...</p></div>'
      : '<div class="empty-state"><p>No data found</p></div>';
  }

  /* ---- Load all data ---- */
  async function loadData() {
    const status = document.getElementById('adminStatus');
    if (status) status.textContent = 'Loading...';
    setLoading(usersBody, true);
    setLoading(ordersBody, true);
    setLoading(itemsBody, true);
    await fetchProfiles();
    await Promise.all([
      loadUsers(),
      loadOrders(),
      loadItems(),
    ]);
    if (status) status.textContent = 'Connected';
  }

  /* ======= User Edit (no listener leak) ======= */
  function setupUserEdit(card, user) {
    const editBtn = card.querySelector('.user-btn-edit');
    const delBtn = card.querySelector('.user-btn-delete');
    const display = card.querySelector('.user-name-display');

    editBtn.addEventListener('click', function onClickEdit() {
      const current = display.textContent === 'No name set' ? '' : display.textContent;
      display.innerHTML = `<input class="user-name-input" value="${current}" />`;
      editBtn.textContent = 'Save';
      editBtn.className = 'user-btn-save';

      const cancel = document.createElement('button');
      cancel.className = 'user-btn-cancel';
      cancel.textContent = 'Cancel';
      card.querySelector('.user-actions').appendChild(cancel);

      function resetEdit() {
        display.innerHTML = current || 'No name set';
        editBtn.textContent = 'Edit';
        editBtn.className = 'user-btn-edit';
        cancel.remove();
        editBtn.removeEventListener('click', onSave);
        editBtn.addEventListener('click', onClickEdit, { once: true });
      }

      async function onSave() {
        const input = display.querySelector('.user-name-input');
        const newName = input.value.trim();
        editBtn.disabled = true;
        editBtn.textContent = 'Saving...';
        const { error } = await supabase.from('profiles').update({ name: newName }).eq('id', card.dataset.id);
        editBtn.disabled = false;
        if (error) { toast('Error: ' + error.message); resetEdit(); return; }
        display.innerHTML = newName || 'No name set';
        resetEdit();
        toast('User updated');
      }

      editBtn.removeEventListener('click', onClickEdit);
      editBtn.addEventListener('click', onSave, { once: true });
      cancel.addEventListener('click', resetEdit, { once: true });
    }, { once: true });

    delBtn.addEventListener('click', async function () {
      if (!confirm('Delete user ' + user.email + ' and all their orders?')) return;
      const uid = card.dataset.id;
      const { error } = await supabase.rpc('admin_delete_user', { target_id: uid });
      if (error) { toast('Delete failed: ' + error.message); return; }
      card.remove();
      usersCount.textContent = usersBody.children.length;
      toast('User deleted');
    });
  }

  /* ======= USERS ======= */
  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('id, email, name, created_at').order('created_at', { ascending: false });
    usersBody.innerHTML = '';
    if (!data || data.length === 0) {
      usersBody.innerHTML = '<div class="empty-state"><p>No users found</p></div>';
      usersCount.textContent = '0';
      return;
    }
    usersCount.textContent = data.length;

    data.forEach(user => {
      const card = document.createElement('div');
      card.className = 'user-card';
      card.dataset.id = user.id;

      const initial = (user.email || '?')[0].toUpperCase();
      const date = new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      card.innerHTML = `
        <div class="user-avatar">${initial}</div>
        <div class="user-info">
          <div class="user-email">${user.email || '—'}</div>
          <div class="user-name"><span class="user-name-display">${user.name || 'No name set'}</span></div>
          <div class="user-date">Joined ${date}</div>
        </div>
        <div class="user-actions">
          <button class="user-btn-edit">Edit</button>
          <button class="user-btn-delete">Delete</button>
        </div>`;

      usersBody.appendChild(card);

      setupUserEdit(card, user);
    });
  }

  /* ======= ORDERS ======= */
  async function loadOrders() {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    ordersBody.innerHTML = '';
    if (!data || data.length === 0) {
      ordersBody.innerHTML = '<div class="empty-state"><p>No orders found</p></div>';
      ordersCount.textContent = '0';
      return;
    }

    ordersCount.textContent = data.length;

    data.forEach(order => {
      const items = order.items || [];
      const itemCount = items.length;
      const date = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

      const card = document.createElement('div');
      card.className = 'order-admin-card';
      card.dataset.id = order.id;

      const itemsHtml = items.map(item => `
        <div class="order-expanded-item">
          <div class="order-expanded-item-left">
            <span class="order-item-qty">${item.quantity}</span>
            <span class="order-item-name">${item.name}</span>
          </div>
          <span class="order-item-line-total">$${(item.price * item.quantity).toFixed(2)}</span>
        </div>`).join('');

      card.innerHTML = `
        <div class="order-card-top">
          <div class="order-card-left">
            <span class="order-card-id">#${order.id.slice(0, 8)}</span>
            <span class="order-card-user">${getEmail(order.user_id)}</span>
            <span class="order-card-items-count">${itemCount} item${itemCount !== 1 ? 's' : ''}</span>
          </div>
          <div class="order-card-center">
            <div class="order-card-amounts">
              <div class="order-card-total">$${parseFloat(order.total).toFixed(2)}</div>
              <div class="order-card-detail">$${parseFloat(order.subtotal).toFixed(2)} + $${parseFloat(order.tax).toFixed(2)} tax</div>
            </div>
          </div>
          <div class="order-card-right">
            <span class="order-card-status ${order.status}">${order.status}</span>
            <span class="order-card-date">${date}</span>
            <span class="order-card-expand-icon">&#9660;</span>
          </div>
        </div>
        <div class="order-card-expanded">
          <div class="order-card-expanded-header">
            <span>Qty</span>
            <span>Item</span>
            <span>Total</span>
          </div>
          ${itemsHtml}
        </div>
        <div class="order-card-footer">
          <select class="order-status-select">
            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
            <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Ready</option>
            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
          <button class="admin-btn-delete order-btn-delete">Delete Order</button>
        </div>`;

      ordersBody.appendChild(card);

      let expanded = false;
      card.querySelector('.order-card-top').addEventListener('click', function () {
        expanded = !expanded;
        card.querySelector('.order-card-expanded').classList.toggle('open', expanded);
        card.querySelector('.order-card-expand-icon').classList.toggle('open', expanded);
      });

      card.querySelector('.order-status-select').addEventListener('change', async function () {
        const { error } = await supabase.from('orders').update({ status: this.value }).eq('id', card.dataset.id);
        if (error) { toast('Error: ' + error.message); return; }
        card.querySelector('.order-card-status').textContent = this.value;
        card.querySelector('.order-card-status').className = 'order-card-status ' + this.value;
        toast('Status updated to ' + this.value);
      });

      card.querySelector('.order-btn-delete').addEventListener('click', async function () {
        if (!confirm('Delete order #' + order.id.slice(0, 8) + '?')) return;
        const { error } = await supabase.from('orders').delete().eq('id', card.dataset.id);
        if (error) { toast('Error: ' + error.message); return; }
        card.remove();
        ordersCount.textContent = ordersBody.children.length;
        toast('Order deleted');
      });
    });
  }

  /* ======= ORDER ITEMS ======= */
  async function loadItems() {
    const { data } = await supabase.from('orders').select('id, items, created_at').order('created_at', { ascending: false });
    itemsBody.innerHTML = '';
    if (!data || data.length === 0) {
      itemsBody.innerHTML = '<div class="empty-state"><p>No items found</p></div>';
      itemsCount.textContent = '0';
      return;
    }

    const flatItems = [];
    data.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          flatItems.push({ ...item, order_id: order.id.slice(0, 8) });
        });
      }
    });

    itemsCount.textContent = flatItems.length;

    if (flatItems.length === 0) {
      itemsBody.innerHTML = '<div class="empty-state"><p>No items found</p></div>';
      return;
    }

    let html = `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Item</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>`;

    flatItems.forEach(item => {
      html += `
            <tr>
              <td class="cell-id">#${item.order_id}</td>
              <td>${item.name}</td>
              <td class="cell-price">$${parseFloat(item.price).toFixed(2)}</td>
              <td>${item.quantity}</td>
              <td class="cell-price">$${(item.price * item.quantity).toFixed(2)}</td>
            </tr>`;
    });

    html += `
          </tbody>
        </table>
      </div>`;

    itemsBody.innerHTML = html;
  }

  console.log('\u{1F332} Ember & Oak Admin loaded.');
})();
