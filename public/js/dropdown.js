// Branded dropdown for pointer devices. Keeps the native <select> as the value
// holder (so existing change handlers keep working) and layers a styled listbox
// on top. Touch devices keep the native picker, which is better on mobile.
(function (g) {
  var esc = g.esc || function (s) { return String(s == null ? '' : s); };
  var CARET = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg>';
  var canHover = function () { return window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches; };

  function enhance(sel) {
    if (sel.dataset.dd === '1' || !canHover() || sel.multiple || sel.size > 1) return;
    sel.dataset.dd = '1';
    sel.classList.add('dd-native');
    sel.setAttribute('tabindex', '-1');
    sel.setAttribute('aria-hidden', 'true');
    var id = sel.id || 'dd' + Math.random().toString(36).slice(2, 8);
    sel.id = id;

    var wrap = document.createElement('div');
    wrap.className = 'dd';

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'dd-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.id = id + '-trigger';
    var desc = sel.getAttribute('aria-describedby');
    if (desc) trigger.setAttribute('aria-describedby', desc);
    trigger.innerHTML = '<span class="dd-value"></span><span class="dd-caret" aria-hidden="true">' + CARET + '</span>';
    // point any <label for="select-id"> at the visible control instead
    var lab = document.querySelector('label[for="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]');
    if (lab) lab.setAttribute('for', trigger.id);

    var menu = document.createElement('ul');
    menu.className = 'dd-menu';
    menu.setAttribute('role', 'listbox');
    menu.id = id + '-list';
    menu.setAttribute('aria-labelledby', trigger.id);

    var items = [];
    Array.prototype.forEach.call(sel.options, function (o, i) {
      var li = document.createElement('li');
      li.className = 'dd-opt';
      li.setAttribute('role', 'option');
      li.id = id + '-o' + i;
      li.dataset.value = o.value;
      li.dataset.i = i;
      li.textContent = o.text;
      menu.appendChild(li);
      items.push(li);
    });

    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);
    wrap.appendChild(trigger);
    wrap.appendChild(menu);

    var cursor = -1;

    function selectedIndex() {
      for (var i = 0; i < items.length; i++) if (items[i].dataset.value === sel.value) return i;
      return -1;
    }
    function syncLabel() {
      var i = selectedIndex();
      trigger.querySelector('.dd-value').textContent = i > -1 ? items[i].textContent : '—';
      items.forEach(function (li) {
        var on = li.dataset.value === sel.value;
        li.setAttribute('aria-selected', on ? 'true' : 'false');
        li.classList.toggle('is-selected', on);
      });
      trigger.classList.toggle('is-invalid', sel.getAttribute('aria-invalid') === 'true');
    }
    function open() {
      if (wrap.classList.contains('is-open')) return;
      wrap.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      cursor = selectedIndex();
      if (cursor > -1) { items[cursor].classList.add('is-active'); trigger.setAttribute('aria-activedescendant', items[cursor].id); }
    }
    function close(refocus) {
      wrap.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.removeAttribute('aria-activedescendant');
      items.forEach(function (li) { li.classList.remove('is-active'); });
      cursor = -1;
      if (refocus) trigger.focus();
    }
    function move(delta, absolute) {
      if (!items.length) return;
      if (cursor > -1) items[cursor].classList.remove('is-active');
      cursor = absolute !== undefined ? absolute : Math.max(0, Math.min(items.length - 1, cursor + delta));
      items[cursor].classList.add('is-active');
      trigger.setAttribute('aria-activedescendant', items[cursor].id);
      items[cursor].scrollIntoView({ block: 'nearest' });
    }
    function commit(i) {
      items[i].click();
    }

    trigger.addEventListener('click', function () { wrap.classList.contains('is-open') ? close(false) : open(); });
    menu.addEventListener('click', function (e) {
      var li = e.target.closest('.dd-opt');
      if (!li) return;
      sel.value = li.dataset.value;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      syncLabel();
      close(true);
    });
    trigger.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'ArrowDown' || k === 'ArrowUp') { e.preventDefault(); open(); move(k === 'ArrowDown' ? 0 : -1, k === 'ArrowDown' ? selectedIndex() : items.length - 1); }
      else if (k === 'Enter' || k === ' ' || k === 'Spacebar') { e.preventDefault(); if (wrap.classList.contains('is-open')) { if (cursor > -1) commit(cursor); } else open(); }
      else if (k === 'Escape') { close(false); }
      else if (k === 'Home') { e.preventDefault(); open(); move(0, 0); }
      else if (k === 'End') { e.preventDefault(); open(); move(0, items.length - 1); }
    });
    menu.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (k === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (k === 'Enter' || k === ' ' || k === 'Spacebar') { e.preventDefault(); if (cursor > -1) commit(cursor); }
      else if (k === 'Escape') { e.preventDefault(); close(true); }
      else if (k === 'Tab') { close(false); }
    });
    document.addEventListener('click', function (e) { if (wrap.classList.contains('is-open') && !wrap.contains(e.target)) close(false); });
    document.addEventListener('focusin', function (e) { if (wrap.classList.contains('is-open') && !wrap.contains(e.target)) close(false); });
    window.addEventListener('resize', function () { if (wrap.classList.contains('is-open')) close(false); });

    // mirror aria-invalid from the native select onto the visible trigger
    if (window.MutationObserver) {
      new MutationObserver(syncLabel).observe(sel, { attributes: true, attributeFilter: ['aria-invalid'] });
    }
    syncLabel();
  }

  function enhanceAll(root) {
    queryAll('select', root).forEach(enhance);
  }
  function queryAll(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  g.YPDropdown = { enhanceAll: enhanceAll, enhance: enhance, canHover: canHover };

  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  onReady(function () {
    enhanceAll(document);
    if (window.MutationObserver && document.body) {
      new MutationObserver(function (muts) {
        muts.forEach(function (m) {
          Array.prototype.forEach.call(m.addedNodes, function (n) {
            if (n.nodeType !== 1) return;
            if (n.tagName === 'SELECT') enhance(n);
            else enhanceAll(n);
          });
        });
      }).observe(document.body, { childList: true, subtree: true });
    }
  });
})(window);