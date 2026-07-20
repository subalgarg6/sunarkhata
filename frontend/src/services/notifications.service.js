import { generateId } from '../utils/helpers.js';

const NOTIFS_KEY = 'sk_notifications';

function getAll() { return JSON.parse(localStorage.getItem(NOTIFS_KEY) || '[]'); }
function saveAll(n) { localStorage.setItem(NOTIFS_KEY, JSON.stringify(n)); }

export function createNotification(userId, accountId, entryId, type, title, body) {
  const notifs = getAll();
  notifs.unshift({ id: generateId(), user_id: userId, account_id: accountId, entry_id: entryId, type, title, body, is_read: false, created_at: new Date().toISOString() });
  saveAll(notifs);
}

export function getNotifications(userId) {
  return getAll().filter(n => n.user_id === userId).slice(0, 20);
}

export function getUnreadCount(userId) {
  return getAll().filter(n => n.user_id === userId && !n.is_read).length;
}

export function markAsRead(notifId) {
  const notifs = getAll();
  const idx = notifs.findIndex(n => n.id === notifId);
  if (idx > -1) { notifs[idx].is_read = true; saveAll(notifs); }
}

export function markAllAsRead(userId) {
  const notifs = getAll();
  notifs.forEach((n, i) => { if (n.user_id === userId) notifs[i].is_read = true; });
  saveAll(notifs);
}
