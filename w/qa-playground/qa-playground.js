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

  /* Tracks name the skill a page drills, never a seniority level: a human and
     an agent writing the same test hit the same five problems. */
  var TRACKS = {
    find:  { name: 'Say my name',      hint: 'locators · shadow roots · frames' },
    drive: { name: 'Handle with care', hint: 'inputs · picks · uploads · drags' },
    sync:  { name: 'Beat the clock',   hint: 'waits · retries · stale nodes' },
    fake:  { name: 'Trust nothing',    hint: 'mocks · storage · isolation' },
    prove: { name: 'Show your work',   hint: 'assertions · a11y · artifacts' }
  };

  var MODULES = [
    { href: 'index.html', label: 'Home' },
    { href: 'inputs.html', label: 'Inputs', track: 'drive' },
    { href: 'selection.html', label: 'Selection', track: 'drive' },
    { href: 'interactive.html', label: 'Interactive', track: 'drive' },
    { href: 'accounts.html', label: 'Accounts', track: 'fake' },
    { href: 'forms.html', label: 'Forms', track: 'drive' },
    { href: 'upload.html', label: 'Upload', track: 'drive' },
    { href: 'frames.html', label: 'Frames', track: 'find' },
    { href: 'shadow-dom.html', label: 'Shadow DOM', track: 'find' },
    { href: 'dynamic.html', label: 'Dynamic', track: 'sync' },
    { href: 'api-mock.html', label: 'Mock API', track: 'fake' },
    { href: 'storage.html', label: 'Storage', track: 'fake' },
    { href: 'data-tables.html', label: 'Tables', track: 'prove' },
    { href: 'downloads.html', label: 'Downloads', track: 'prove' },
    { href: 'accessibility.html', label: 'A11y', track: 'prove' }
  ];

  function mountLayout() {
    if (document.body.hasAttribute('data-bare')) return;
    var file = location.pathname.split('/').pop() || 'index.html';
    var container = document.querySelector('.container');
    if (container && !container.id) container.id = 'content';

    var html = '<div class="pg-topbar-shell">' +
      '<div class="pg-topbar-inner">' +
      '<a class="pg-brand" href="index.html">QA <span>Playground</span></a>' +
      '<a class="pg-back" href="../../index.html">&larr; Back to site</a>' +
      '</div>' +
      '<nav class="pg-nav" aria-label="QA Playground modules"><div class="pg-nav-inner">';
    MODULES.forEach(function (m) {
      var active = m.href === file;
      var track = m.track && TRACKS[m.track];
      html += '<a href="' + m.href + '"' + (active ? ' class="active" aria-current="page"' : '') + '>' +
        m.label +
        (track
          ? '<span class="dot t-' + m.track + '" title="' +
            escapeHtml(track.name + ' — ' + track.hint) + '"></span>'
          : '') +
        '</a>';
    });
    html += '</div></nav></div>';

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
  window.QA = {
    escapeHtml: escapeHtml, sleep: sleep, toast: toast, mountLayout: mountLayout,
    TRACKS: TRACKS, MODULES: MODULES
  };
})();
