/* QA Playground — shared helpers */
(function () {
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }
  var toastTimer;
  function toast(msg, isError) {
    var el = document.getElementById('toastEl');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toastEl';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.className = 'toast' + (isError ? ' error' : '');
    el.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.style.display = 'none'; }, 3000);
  }
  var MODULES = [
    { href: 'index.html', label: 'Home' },
    { href: 'inputs.html', label: 'Inputs', lv: 'L1' },
    { href: 'selection.html', label: 'Selection', lv: 'L1' },
    { href: 'interactive.html', label: 'Interactive', lv: 'L1' },
    { href: 'frames.html', label: 'Frames', lv: 'L2' },
    { href: 'data-tables.html', label: 'Tables', lv: 'L2' },
    { href: 'dynamic.html', label: 'Dynamic', lv: 'L2' },
    { href: 'forms.html', label: 'Forms', lv: 'L2' },
    { href: 'downloads.html', label: 'Downloads', lv: 'L2' },
    { href: 'upload.html', label: 'Upload', lv: 'L2' },
    { href: 'api-mock.html', label: 'Mock API', lv: 'L3' },
    { href: 'accessibility.html', label: 'A11y', lv: 'L3' },
    { href: 'shadow-dom.html', label: 'Shadow DOM', lv: 'L3' },
    { href: 'storage.html', label: 'Storage', lv: 'L3' }
  ];

  function mountLayout() {
    if (document.body.hasAttribute('data-bare')) return;
    var file = location.pathname.split('/').pop() || 'index.html';
    var container = document.querySelector('.container');
    if (container && !container.id) container.id = 'content';
    var html = '<div class="pg-topbar-inner">' +
      '<a class="pg-brand" href="index.html">QA <span>Playground</span></a>' +
      '<a class="pg-back" href="../../index.html">← Back to site</a>' +
      '</div><nav class="pg-nav" aria-label="QA Playground modules"><div class="pg-nav-inner">';
    MODULES.forEach(function (m) {
      var active = m.href === file;
      html += '<a href="' + m.href + '"' + (active ? ' class="active" aria-current="page"' : '') + '>' +
        m.label + (m.lv ? ' <span class="lv">' + m.lv + '</span>' : '') + '</a>';
    });
    html += '</div></nav>';
    var header = document.createElement('header');
    header.className = 'pg-topbar';
    header.innerHTML = html;
    document.body.insertBefore(header, document.body.firstChild);
    var skip = document.createElement('a');
    skip.className = 'skip-link';
    skip.href = '#content';
    skip.textContent = 'Skip to content';
    document.body.insertBefore(skip, header);
    Array.prototype.forEach.call(document.querySelectorAll('a.back'), function (a) { a.remove(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountLayout);
  } else {
    mountLayout();
  }

  window.escapeHtml = escapeHtml;
  window.sleep = sleep;
  window.toast = toast;
  window.QA = { escapeHtml: escapeHtml, sleep: sleep, toast: toast, mountLayout: mountLayout };
})();
