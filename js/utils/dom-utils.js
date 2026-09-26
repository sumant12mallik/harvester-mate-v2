// ============================================
// 🎨 DOM Utilities
// ============================================

export const $ = (selector, parent = document) => parent.querySelector(selector);
export const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));
export const byId = (id) => document.getElementById(id);

export function createElement(tag, options = {}) {
  const el = document.createElement(tag);
  const { className, id, text, html, attrs, style, children } = options;

  if (className) el.className = className;
  if (id) el.id = id;
  if (text) el.textContent = text;
  if (html) el.innerHTML = html;
  if (attrs) Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  if (style) Object.assign(el.style, style);
  if (children) {
    children.forEach((child) => {
      if (typeof child === 'string') el.appendChild(document.createTextNode(child));
      else if (child instanceof HTMLElement) el.appendChild(child);
    });
  }
  return el;
}

export function show(el) {
  if (typeof el === 'string') el = $(el);
  if (el) el.style.display = '';
}

export function hide(el) {
  if (typeof el === 'string') el = $(el);
  if (el) el.style.display = 'none';
}

export function toggle(el) {
  if (typeof el === 'string') el = $(el);
  if (!el) return;
  el.style.display = el.style.display === 'none' ? '' : 'none';
}

export function addClass(el, className) {
  if (typeof el === 'string') el = $(el);
  if (el) el.classList.add(className);
}

export function removeClass(el, className) {
  if (typeof el === 'string') el = $(el);
  if (el) el.classList.remove(className);
}

export function toggleClass(el, className) {
  if (typeof el === 'string') el = $(el);
  if (el) el.classList.toggle(className);
}

export function setButtonLoading(btn, loading = true, loadingText = 'Loading...') {
  if (typeof btn === 'string') btn = $(btn);
  if (!btn) return;

  if (loading) {
    btn.dataset.originalText = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner spinner-sm"></span> ${loadingText}`;
  } else {
    btn.disabled = false;
    btn.textContent = btn.dataset.originalText || 'Submit';
  }
}

export function getFormData(formElement) {
  if (typeof formElement === 'string') formElement = $(formElement);
  if (!formElement) return {};
  const formData = new FormData(formElement);
  const obj = {};
  for (const [key, value] of formData.entries()) {
    obj[key] = typeof value === 'string' ? value.trim() : value;
  }
  return obj;
}

export function fillForm(formElement, data = {}) {
  if (typeof formElement === 'string') formElement = $(formElement);
  if (!formElement) return;

  Object.entries(data).forEach(([key, value]) => {
    const input = formElement.querySelector(`[name="${key}"]`);
    if (!input) return;
    if (input.type === 'checkbox') input.checked = !!value;
    else input.value = value ?? '';
  });
}

export function clearForm(formElement) {
  if (typeof formElement === 'string') formElement = $(formElement);
  if (!formElement) return;
  formElement.reset();
  formElement.querySelectorAll('.input-error').forEach((el) => el.classList.remove('error'));
}

export function scrollTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function scrollTo(el, offset = 0) {
  if (typeof el === 'string') el = $(el);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: y, behavior: 'smooth' });
}

export function empty(el) {
  if (typeof el === 'string') el = $(el);
  if (el) el.innerHTML = '';
}

export function setText(el, text) {
  if (typeof el === 'string') el = $(el);
  if (el) el.textContent = text;
}

export function setHTML(el, html) {
  if (typeof el === 'string') el = $(el);
  if (el) el.innerHTML = html;
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    return false;
  }
}

export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function focus(el, delay = 0) {
  if (typeof el === 'string') el = $(el);
  if (!el) return;
  setTimeout(() => el.focus(), delay);
}