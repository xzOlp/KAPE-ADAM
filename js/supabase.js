(function () {
  'use strict';

  const SUPABASE_URL = 'https://uqvayowsuyrkqcdmdfnw.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdmF5b3dzdXlya3FjZG1kZm53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MDA1NzksImV4cCI6MjA5NDM3NjU3OX0.Jfx7QM8yCD9TBw0KFl91jLFGUWIU17F5R7z2bAAW6Lk';

  const { createClient } = window.supabase;
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { data, error };
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  function onAuthChange(callback) {
    supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }

  async function getSession() {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
  }

  async function refreshSession() {
    const { data, error } = await supabase.auth.refreshSession();
    return { session: data.session, error };
  }

  async function getUser() {
    const { data, error } = await supabase.auth.getUser();
    return { user: data.user, error };
  }

  async function getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    return { data, error };
  }

  async function updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    return { data, error };
  }

  async function saveOrder(userId, cart) {
    if (!cart || cart.length === 0) return { error: 'Cart is empty' };

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    const items = cart.map(item => ({
      item_id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        items: items,
        subtotal: Number(subtotal.toFixed(2)),
        tax: Number(tax.toFixed(2)),
        total: Number(total.toFixed(2)),
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) return { error: orderError };

    return { data: order, error: null };
  }

  async function getOrders(userId) {
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (ordersError) return { orders: [], error: ordersError };

    return { orders: orders || [], error: null };
  }

  let ordersChannel = null;

  function subscribeOrders(userId, onUpdate) {
    unsubscribeOrders();
    ordersChannel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        if (onUpdate) onUpdate(payload.new);
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        if (onUpdate) onUpdate(payload.new);
      })
      .subscribe();
  }

  function unsubscribeOrders() {
    if (ordersChannel) {
      supabase.removeChannel(ordersChannel);
      ordersChannel = null;
    }
  }

  const STATUS_STEPS = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];

  async function advanceOrderStatus(orderId, currentStatus) {
    const idx = STATUS_STEPS.indexOf(currentStatus);
    if (idx < 0 || idx >= STATUS_STEPS.length - 1) return { advanced: false };
    const nextStatus = STATUS_STEPS[idx + 1];
    const { data, error } = await supabase
      .from('orders')
      .update({ status: nextStatus })
      .eq('id', orderId)
      .eq('status', currentStatus)
      .select();
    if (error) return { advanced: false, error };
    return { advanced: data && data.length > 0, nextStatus };
  }

  window.EmbOakSupabase = {
    supabase,
    signUp,
    signIn,
    signOut,
    onAuthChange,
    getSession,
    refreshSession,
    getUser,
    getProfile,
    updateProfile,
    saveOrder,
    getOrders,
    subscribeOrders,
    unsubscribeOrders,
    advanceOrderStatus,
    STATUS_STEPS,
  };
})();
