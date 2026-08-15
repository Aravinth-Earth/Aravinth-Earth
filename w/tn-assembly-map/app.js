async function initMap() {
  const [GEOJSON_DATA, DISTRICTS_DATA, TIMELINE] = await Promise.all([
    fetch('data/constituencies.json').then(r => r.json()),
    fetch('data/districts.json').then(r => r.json()),
    fetch('data/timeline.json').then(r => r.json()),
  ]);

  const EVENTS = TIMELINE.events;
  const PARTY_COLORS = TIMELINE.party_colors || {};
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const startMonths = TIMELINE.start_year * 12 + (TIMELINE.start_month - 1);
  const nowMonths = TIMELINE.now_year * 12 + (TIMELINE.now_month - 1);
  const totalMonths = nowMonths - startMonths;

  EVENTS.forEach(e => {
    const p = e.date.split('-');
    e._y = parseInt(p[0]); e._m = parseInt(p[1]); e._d = parseInt(p[2]) || 1;
    e._months = e._y * 12 + (e._m - 1);
  });

  const map = L.map('map', {
    zoomControl: true, center: [10.82, 78.7], zoom: 8,
  });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OSM &copy; CARTO', subdomains: 'abcd', maxZoom: 19,
  }).addTo(map);

  function buildIdx(geojson) {
    const idx = {};
    geojson.features.forEach((f, i) => {
      const p = f.properties;
      idx[p.ac_name + '|' + (p.ac_no || '')] = i;
    });
    return idx;
  }
  const acIndex = buildIdx(GEOJSON_DATA);

  L.geoJSON(DISTRICTS_DATA, {
    style: { color: 'rgba(250,240,200,0.09)', weight: 1, fillOpacity: 0, dashArray: '4 5' },
    onEachFeature: (f, layer) => {
      layer.bindTooltip('<b>' + (f.properties.name||'') + ' District</b>', { sticky: true, direction: 'center' });
    }
  }).addTo(map);

  let ministerLayer = L.layerGroup().addTo(map);
  const baseACStyle = { fillColor: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.08)', weight: 0.5, fillOpacity: 0.1 };
  L.geoJSON(JSON.parse(JSON.stringify(GEOJSON_DATA)).features, { style: baseACStyle }).addTo(map);

  function getPartyColor(party) { return PARTY_COLORS[party] || '#888'; }

  function getFeatureIdx(m) {
    const key = m.geojson_name + '|' + (m.ac_no || '');
    let fi = acIndex[key];
    if (fi !== undefined) return fi;
    for (const [k, v] of Object.entries(acIndex)) {
      const [name, no] = k.split('|');
      if (name === m.geojson_name && (!m.ac_no || no === String(m.ac_no))) return v;
    }
    return -1;
  }

  function fmtDate(y, m, d) {
    return MONTHS[m-1] + ' ' + (d||1) + ', ' + y;
  }

  function findActiveEvent(monthsOffset) {
    const absMonths = startMonths + monthsOffset;
    let best = null;
    for (const e of EVENTS) {
      if (e._months <= absMonths) {
        if (!best || e._months >= best._months) best = e;
      }
    }
    return best;
  }

  function renderState(event) {
    ministerLayer.clearLayers();
    if (!event) return;

    const isGov = event.status === 'governor_rule' || event.status === 'transition';
    const isCmOnly = event.status === 'cm_only';

    const d = event.date.split('-');
    document.getElementById('event-label-bar').textContent = MONTHS[parseInt(d[1])-1] + ' ' + d[0] + ' — ' + event.label;

    const badge = document.getElementById('status-badge');
    if (isGov) badge.innerHTML = '<b>\u2691 Governor\'s Rule</b>';
    else if (isCmOnly) badge.innerHTML = '<b>\u2605 CM Sworn In</b> \u2014 Cabinet yet to form';
    else if (event.status === 'partial_cabinet') badge.innerHTML = '<b>Partial Cabinet</b> \u2014 ' + event.ministers.length + ' ministers';
    else badge.innerHTML = '<b>Full Cabinet</b> \u2014 ' + event.ministers.length + ' ministers';

    const lcr = document.getElementById('legend-cm-row');
    const lgr = document.getElementById('legend-governor-row');
    const hasCM = event.ministers.some(m => m.is_cm);
    lcr.style.display = hasCM && !isGov ? 'flex' : 'none';
    lgr.style.display = isGov ? 'flex' : 'none';

    const lp = document.getElementById('legend-parties');
    if (!isGov && event.ministers.length > 0) {
      const seen = new Set();
      let html = '';
      event.ministers.forEach(m => {
        if (!seen.has(m.party) && m.party && !m.is_cm) {
          seen.add(m.party);
          const c = getPartyColor(m.party);
          html += '<div class="legend-row">' +
            '<span class="legend-swatch" style="background:' + c + ';border:1px solid rgba(255,255,255,0.3);"></span>' +
            '<span>' + m.party + '</span></div>';
        }
      });
      lp.innerHTML = html;
    } else { lp.innerHTML = ''; }
    document.getElementById('govt-info').innerHTML =
      '<b>' + (event.label || '') + '</b><br>' + (event.notes || '');

    const dot = document.getElementById('vline-thumb');
    const cur = event._months - startMonths;
    const pct = totalMonths > 0 ? (cur / totalMonths) * 100 : 0;
    dot.style.top = Math.min(100, Math.max(0, pct)) + '%';
    document.getElementById('vdate-label').textContent = fmtDate(event._y, event._m, event._d);

    if (isGov) {
      const neutral = JSON.parse(JSON.stringify(GEOJSON_DATA)).features;
      L.geoJSON(neutral, {
        style: { fillColor: '#444', color: '#666', weight: 0.5, fillOpacity: 0.3 },
        onEachFeature: (f, layer) => {
          layer.bindTooltip('<b>' + (f.properties.ac_name||'') + '</b><br><span style="color:#888;">Governor\'s Rule</span>', { sticky: true });
        }
      }).addTo(ministerLayer);
      return;
    }

    const matched = new Set();
    event.ministers.forEach(m => { const fi = getFeatureIdx(m); if (fi >= 0) matched.add(fi); });

    const partyMinisterMap = {};
    event.ministers.forEach(m => {
      const fi = getFeatureIdx(m);
      if (fi >= 0) partyMinisterMap[fi] = m;
    });

    const nonMinStyle = { fillColor: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.08)', weight: 0.5, fillOpacity: 0.1 };
    const nonMinFeatures = [];
    const minFeatures = [];

    GEOJSON_DATA.features.forEach((feat, i) => {
      const f = JSON.parse(JSON.stringify(feat));
      if (partyMinisterMap[i]) {
        const m = partyMinisterMap[i];
        f.properties._min = m;
        minFeatures.push(f);
      } else {
        nonMinFeatures.push(f);
      }
    });

    L.geoJSON(nonMinFeatures, {
      style: nonMinStyle,
      onEachFeature: (f, layer) => {
        layer.bindTooltip('<b>' + (f.properties.ac_name||'') + '</b>' + (f.properties.ac_no ? ' (#'+f.properties.ac_no+')' : ''), { sticky: true });
      }
    }).addTo(ministerLayer);

    function minStyle(m) {
      if (!m) return nonMinStyle;
      if (m.is_cm) return { fillColor: '#ffd700', color: '#fff', weight: 2.5, fillOpacity: 0.7, dashArray: '' };
      return { fillColor: getPartyColor(m.party), color: 'rgba(255,255,255,0.6)', weight: 1.2, fillOpacity: 0.45 };
    }

    L.geoJSON(minFeatures, {
      style: function(f) { return minStyle(f.properties._min); },
      onEachFeature: (f, layer) => {
        const m = f.properties._min;
        if (!m) return;
        let html = '';
        if (m.is_cm) {
          html = '<span style="color:#ffd700;font-size:15px;">\u2605</span> <b>' + (f.properties.ac_name||'') + '</b>';
          html += '<div style="margin-top:2px;color:#ffd700;"><b>' + m.name + '</b> \u2014 Chief Minister</div>';
        } else {
          html = '<b>' + (f.properties.ac_name||'') + '</b>';
          html += '<div style="margin-top:2px;"><b>' + m.name + '</b></div>';
        }
        html += '<div style="font-size:10px;color:rgba(255,255,255,0.45);">' + (m.portfolio||'') + '</div>';
        html += '<div style="font-size:9px;color:rgba(255,255,255,0.3);">' + (m.party||'') + '</div>';
        layer.bindTooltip(html, { sticky: true, offset: [0, -6] });
        layer.on('mouseover', function() { this.setStyle({ weight: 2.5, color: '#fff' }); });
        layer.on('mouseout', function() { this.setStyle(minStyle(m)); });
      }
    }).addTo(ministerLayer);
  }

  let currentMonth = totalMonths;

  function setMonth(month) {
    currentMonth = Math.max(0, Math.min(totalMonths, Math.round(month)));
    const ev = findActiveEvent(currentMonth);
    if (ev) renderState(ev);
    const pct = totalMonths > 0 ? (currentMonth / totalMonths) * 100 : 0;
    document.getElementById('vline-thumb').style.top = Math.min(100, Math.max(0, pct)) + '%';
    const absM = startMonths + currentMonth;
    const y = Math.floor(absM / 12);
    const m = (absM % 12) + 1;
    document.getElementById('vdate-label').textContent = fmtDate(y, m, 1);
  }

  const vtrack = document.getElementById('vline-track');
  vtrack.addEventListener('click', function(e) {
    const rect = this.getBoundingClientRect();
    const pct = (e.clientY - rect.top) / rect.height;
    const month = Math.round(pct * totalMonths);
    setMonth(month);
  });

  let dragging = false;
  const vthumb = document.getElementById('vline-thumb');
  vthumb.addEventListener('mousedown', function(e) { e.stopPropagation(); dragging = true; });
  document.addEventListener('mousemove', function(e) {
    if (!dragging) return;
    const rect = vtrack.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setMonth(pct * totalMonths);
  });
  document.addEventListener('mouseup', function() { dragging = false; });

  vthumb.addEventListener('touchstart', function(e) { e.preventDefault(); dragging = true; });
  document.addEventListener('touchmove', function(e) {
    if (!dragging) return;
    const rect = vtrack.getBoundingClientRect();
    const touch = e.touches[0];
    const pct = Math.max(0, Math.min(1, (touch.clientY - rect.top) / rect.height));
    setMonth(pct * totalMonths);
  });
  document.addEventListener('touchend', function() { dragging = false; });

  setMonth(totalMonths);

  const playBtn = document.getElementById('play-btn');
  let playing = false;
  let animation = null;

  playBtn.addEventListener('click', function() {
    playing = !playing;
    if (playing) {
      playBtn.innerHTML = '\u2759\u2759';
      playBtn.title = 'Pause';
      let startAt = currentMonth;
      if (startAt >= totalMonths) { startAt = 0; }
      const remaining = totalMonths - startAt;
      const durationMs = Math.max(500, (remaining / 10) * 1000);
      const animObj = { pos: startAt };
      animation = anime({
        targets: animObj,
        pos: [startAt, totalMonths],
        duration: durationMs,
        easing: 'linear',
        round: 1,
        update: function() {
          const val = animObj.pos;
          if (val !== undefined && !isNaN(val)) { setMonth(val); }
        },
        complete: function() {
          setMonth(totalMonths);
          playing = false;
          playBtn.innerHTML = '\u25B6';
          playBtn.title = 'Play';
          animation = null;
        }
      });
    } else {
      if (animation) { animation.pause(); animation = null; }
      playBtn.innerHTML = '\u25B6';
      playBtn.title = 'Play';
    }
  });
}

initMap();
