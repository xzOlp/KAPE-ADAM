(function () {
  'use strict';

  const SUPABASE_URL = 'https://uqvayowsuyrkqcdmdfnw.supabase.co';
  const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdmF5b3dzdXlya3FjZG1kZm53Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODgwMDU3OSwiZXhwIjoyMDk0Mzc2NTc5fQ.L2S-w4ujca80A63wfo9-33_fzBfIr82VzA4YjmDwWxk';

  const { createClient } = window.supabase;
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const ADMIN_PASSWORD = 'admin123';

  const gate       = document.getElementById('adminGate');
  const dashboard  = document.getElementById('adminDashboard');
  const gateError  = document.getElementById('gateError');
  const gatePass   = document.getElementById('gatePassword');
  const gateBtn    = document.getElementById('gateBtn');
  const lockBtn    = document.getElementById('adminLockBtn');
  const adminStatus = document.getElementById('adminStatus');

  const usersBody  = document.getElementById('usersBody');
  const ordersBody = document.getElementById('ordersBody');
  const itemsBody  = document.getElementById('itemsBody');

  const usersCount  = document.getElementById('usersCount');
  const ordersCount = document.getElementById('ordersCount');
  const itemsCount  = document.getElementById('itemsCount');

  let profilesCache = {};

  function showAdminError(msg) {
    gateError.style.display = msg ? 'block' : 'none';
    gateError.textContent = msg;
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
    gate.style.display = 'none';
    dashboard.style.display = 'block';
    showAdminError('');
    loadData();
  }

  function lock() {
    sessionStorage.removeItem('admin_unlocked');
    dashboard.style.display = 'none';
    gate.style.display = 'flex';
    gatePass.value = '';
    showAdminError('');
  }

  /* ---- Gate ---- */
  if (sessionStorage.getItem('admin_unlocked')) {
    unlock();
  }

  gateBtn.addEventListener('click', function () {
    if (gatePass.value === ADMIN_PASSWORD) {
      unlock();
    } else {
      showAdminError('Incorrect password');
    }
  });
  gatePass.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') gateBtn.click();
  });

  lockBtn.addEventListener('click', lock);

  /* ---- Load all data ---- */
  async function loadData() {
    adminStatus.textContent = 'Loading...';
    await fetchProfiles();
    await Promise.all([
      loadUsers(),
      loadOrders(),
      loadItems(),
    ]);
    adminStatus.textContent = 'Connected';
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

      card.querySelector('.user-btn-edit').addEventListener('click', function () {
        const display = card.querySelector('.user-name-display');
        const current = display.textContent === 'No name set' ? '' : display.textContent;
        display.innerHTML = `<input class="user-name-input" value="${current}" />`;
        this.textContent = 'Save';
        this.className = 'user-btn-save';

        const cancel = document.createElement('button');
        cancel.className = 'user-btn-cancel';
        cancel.textContent = 'Cancel';
        card.querySelector('.user-actions').appendChild(cancel);

        cancel.addEventListener('click', function () {
          display.innerHTML = current || 'No name set';
          card.querySelector('.user-btn-save').textContent = 'Edit';
          card.querySelector('.user-btn-save').className = 'user-btn-edit';
          cancel.remove();
        });

        this.addEventListener('click', async function saveHandler() {
          const input = display.querySelector('.user-name-input');
          const newName = input.value.trim();
          const { error } = await supabase.from('profiles').update({ name: newName }).eq('id', card.dataset.id);
          if (error) { toast('Error: ' + error.message); return; }
          display.innerHTML = newName || 'No name set';
          card.querySelector('.user-btn-save').textContent = 'Edit';
          card.querySelector('.user-btn-save').className = 'user-btn-edit';
          cancel.remove();
          toast('User updated');
        }, { once: true });
      });

      card.querySelector('.user-btn-delete').addEventListener('click', async function () {
        if (!confirm('Delete user ' + user.email + ' and all their orders?')) return;
        const { error } = await supabase.auth.admin.deleteUser(card.dataset.id);
        if (error) { toast('Delete failed: ' + error.message); return; }
        card.remove();
        usersCount.textContent = usersBody.children.length;
        toast('User and their orders deleted');
      });
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
            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
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
