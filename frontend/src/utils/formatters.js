export function formatCurrency(amount, currency = 'INR') {
  const num = Number(amount) || 0;
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: num % 1 === 0 ? 0 : 2
    }).format(num);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: num % 1 === 0 ? 0 : 2
  }).format(num);
}

// Safe date parsing supporting both YYYY-MM-DD and YYYY-MM-DD HH:MM
export function parseDate(dateString) {
  if (!dateString) return null;
  if (typeof dateString !== 'string') return new Date(dateString);
  const parts = dateString.split(/[- :T]/).map(Number);
  if (parts.length >= 3 && !parts.slice(0, 3).some(isNaN)) {
    const year = parts[0];
    const month = parts[1] - 1;
    const day = parts[2];
    const hours = parts[3] || 0;
    const minutes = parts[4] || 0;
    return new Date(year, month, day, hours, minutes);
  }
  const fallback = new Date(dateString.replace(' ', 'T'));
  return isNaN(fallback.getTime()) ? null : fallback;
}

export function formatDateLabel(dateString) {
  if (!dateString) return '';
  const date = parseDate(dateString);
  if (!date || isNaN(date.getTime())) return dateString;

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  if (isSameDay(date, today)) {
    return 'Today';
  } else if (isSameDay(date, yesterday)) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  }
}

export function formatTime(dateString) {
  if (!dateString || !dateString.includes(':')) return '';
  const date = parseDate(dateString);
  if (!date || isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function getCurrentDateLocal() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function getCurrentDateTimeLocal() {
  return getCurrentDateLocal();
}

// Generate unique transaction ID based on current time: YYYYMMDDHHMMSS
export function generateTimestampId(dateObj = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const y = dateObj.getFullYear();
  const m = pad(dateObj.getMonth() + 1);
  const d = pad(dateObj.getDate());
  const h = pad(dateObj.getHours());
  const min = pad(dateObj.getMinutes());
  const s = pad(dateObj.getSeconds());
  return `${y}${m}${d}${h}${min}${s}`;
}
