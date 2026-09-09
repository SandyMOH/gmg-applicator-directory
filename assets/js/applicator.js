/**
 * Applicator Directory v3.1.1
 * 3-tab layout: All / Certified Sprayers / Spray Hubs
 * Uses Google Maps API
 * Compatible with Elementor, Divi, and Gutenberg
 */
(function () {
  'use strict';

  if (typeof appDirData === 'undefined') return;

  var sprayers = appDirData.sprayers || [];
  var hubs = appDirData.hubs || [];
  var independents = appDirData.independents || [];

  var map, infoWindow;
  var markers = [];
  var activeTab = 'all';
  var activeId = null;
  var openHubId = null;
  var searchQuery = '';

  // ===== Helpers =====
  function esc(str) {
    if (!str) return '';
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function toLetter(i) {
    var s = '';
    var n = i;
    do {
      s = String.fromCharCode(65 + (n % 26)) + s;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return s;
  }

  function buildAddress(item) {
    return [item.suburb, item.city, item.state, item.post_code].filter(Boolean).join(', ');
  }

  // Label / value row used by both the list cards and the map popups.
  // `value` is raw HTML, so callers escape their own text.
  function metaRow(label, value, valueClass) {
    if (!value) return '';
    return '<div class="appdir-meta-row">' +
      '<span class="appdir-meta-label">' + label + '</span>' +
      '<span class="appdir-meta-value' + (valueClass ? ' ' + valueClass : '') + '">' + value + '</span>' +
      '</div>';
  }

  function telLink(phone) {
    if (!phone) return '';
    return '<a href="tel:' + esc(phone) + '">' + esc(phone) + '</a>';
  }

  function mailLink(email) {
    if (!email) return '';
    return '<a href="mailto:' + esc(email) + '">' + esc(email) + '</a>';
  }

  function matchesSearch(item) {
    if (!searchQuery) return true;
    var text = [
      item.title, item.company, item.city, item.state,
      item.suburb, item.region, item.cert_number, item.email
    ].join(' ').toLowerCase();
    return text.indexOf(searchQuery) !== -1;
  }

  function hubMatchesSearch(hub) {
    if (!searchQuery) return true;
    var text = [hub.title, hub.company, hub.city, hub.state, hub.suburb, hub.region].join(' ').toLowerCase();
    return text.indexOf(searchQuery) !== -1;
  }

  // ===== Map =====
  // Solid teardrop pin: dark for hubs, brand green for sprayers.
  function createMarkerIcon(label, type) {
    var fill = type === 'hub' ? '#1f2421' : '#93d501';
    var textColor = type === 'hub' ? '#93d501' : '#1f2421';
    var fontSize = String(label).length > 1 ? 12 : 14;
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
        '<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 26 16 26s16-14 16-26C32 7.2 24.8 0 16 0z" fill="' + fill + '"/>' +
        '<text x="16" y="21.5" text-anchor="middle" font-family="Poppins, Helvetica, Arial, sans-serif" font-size="' + fontSize + '" font-weight="bold" fill="' + textColor + '">' + label + '</text>' +
        '</svg>'
      ),
      scaledSize: new google.maps.Size(32, 42),
      anchor: new google.maps.Point(16, 42),
    };
  }

  function clearMarkers() {
    markers.forEach(function (m) { m.setMap(null); });
    markers = [];
  }

  function addMarker(item, label, type) {
    if (!item.lat || !item.lng) return null;

    var marker = new google.maps.Marker({
      position: { lat: parseFloat(item.lat), lng: parseFloat(item.lng) },
      map: map,
      icon: createMarkerIcon(label, type),
      title: item.title,
    });

    var content = '<div class="appdir-popup">' +
      '<div class="appdir-popup-head">' +
      '<span class="appdir-popup-title">' + esc(item.title) + '</span>' +
      '<span class="appdir-badge' + (type === 'hub' ? '' : ' sprayer') + '">' +
      (type === 'hub' ? 'Spray Hub' : 'Certified') + '</span>' +
      '</div>' +
      '<div class="appdir-card-meta">' +
      metaRow('Location', esc(buildAddress(item))) +
      metaRow('Phone', telLink(item.phone)) +
      metaRow('Email', mailLink(item.email)) +
      metaRow('Cert No.', esc(item.cert_number), 'mono') +
      '</div>' +
      '</div>';

    marker.addListener('click', function () {
      infoWindow.setContent(content);
      infoWindow.open(map, marker);
      activeId = item.id;
      renderList();
    });

    marker._itemId = item.id;
    markers.push(marker);
    return marker;
  }

  function fitMapToMarkers() {
    if (markers.length === 0) return;
    if (markers.length === 1) {
      map.setCenter(markers[0].getPosition());
      map.setZoom(11);
      return;
    }
    var bounds = new google.maps.LatLngBounds();
    markers.forEach(function (m) { bounds.extend(m.getPosition()); });
    map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
  }

  function flyToItem(id) {
    if (!map) return;
    var m = markers.find(function (mk) { return mk._itemId === id; });
    if (m) {
      map.panTo(m.getPosition());
      map.setZoom(12);
      google.maps.event.trigger(m, 'click');
    }
  }

  // ===== Update map markers based on current tab + state =====
  function updateMap() {
    if (!map) return;
    clearMarkers();
    var counter = 0;

    if (activeTab === 'all') {
      hubs.filter(hubMatchesSearch).forEach(function (h) {
        counter++;
        addMarker(h, String(counter), 'hub');
      });
      sprayers.filter(matchesSearch).forEach(function (s) {
        counter++;
        addMarker(s, String(counter), 'sprayer');
      });
    }

    if (activeTab === 'sprayers') {
      sprayers.filter(matchesSearch).forEach(function (s) {
        counter++;
        addMarker(s, String(counter), 'sprayer');
      });
    }

    if (activeTab === 'hubs') {
      hubs.filter(hubMatchesSearch).forEach(function (h) {
        counter++;
        addMarker(h, String(counter), 'hub');

        // If this hub is expanded, add sprayer pins with A, B, C
        if (openHubId === h.id && h.sprayers) {
          h.sprayers.forEach(function (s, i) {
            addMarker(s, toLetter(i), 'sprayer');
          });
        }
      });
    }

    fitMapToMarkers();
  }

  // ===== Render list =====
  function renderList() {
    var list = document.getElementById('appdir-list');
    if (!list) return;
    var html = '';
    var counter = 0;

    // --- ALL TAB: everything flat ---
    if (activeTab === 'all') {
      var filteredHubs = hubs.filter(hubMatchesSearch);
      var filteredSprayers = sprayers.filter(matchesSearch);

      filteredHubs.forEach(function (h) {
        counter++;
        html += renderHubFlatCard(h, counter);
      });
      filteredSprayers.forEach(function (s) {
        counter++;
        html += renderSprayerCard(s, counter);
      });

      if (counter === 0) html = '<div class="appdir-empty">Nothing matches your search.</div>';

      document.getElementById('count-all').textContent = hubs.length + sprayers.length;
    }

    // --- SPRAYERS TAB: flat ---
    if (activeTab === 'sprayers') {
      var filteredSprayers = sprayers.filter(matchesSearch);
      filteredSprayers.forEach(function (s) {
        counter++;
        html += renderSprayerCard(s, counter);
      });

      if (counter === 0) html = '<div class="appdir-empty">No certified sprayers match your search.</div>';

      document.getElementById('count-sprayers').textContent = sprayers.length;
    }

    // --- HUBS TAB: accordion ---
    if (activeTab === 'hubs') {
      var filteredHubs2 = hubs.filter(hubMatchesSearch);
      filteredHubs2.forEach(function (h) {
        counter++;
        html += renderHubAccordion(h, counter);
      });

      if (counter === 0) html = '<div class="appdir-empty">No spray hubs match your search.</div>';

      document.getElementById('count-hubs').textContent = hubs.length;
    }

    list.innerHTML = html;

    // Update counts on first render
    document.getElementById('count-all').textContent = hubs.length + sprayers.length;
    document.getElementById('count-sprayers').textContent = sprayers.length;
    document.getElementById('count-hubs').textContent = hubs.length;

    // Update results text
    var resultsEl = document.getElementById('appdir-results-count');
    if (activeTab === 'all') resultsEl.textContent = (hubs.length + sprayers.length) + ' listings';
    if (activeTab === 'sprayers') resultsEl.textContent = sprayers.length + ' certified sprayers';
    if (activeTab === 'hubs') resultsEl.textContent = hubs.length + ' spray hubs';

    // Bind click events
    bindCardClicks();
    bindHubAccordionClicks();
    bindHubSprayerClicks();
  }

  // ===== Card renderers =====
  function sprayerCountBadge(h) {
    var n = h.sprayers ? h.sprayers.length : 0;
    if (!n) return '';
    return '<span class="appdir-badge count">' + n + ' Sprayer' + (n !== 1 ? 's' : '') + '</span>';
  }

  function hubBadge(h) {
    return h.is_gmg
      ? '<span class="appdir-badge gmg">GMG Hub</span>'
      : '<span class="appdir-badge hub">Spray Hub</span>';
  }

  function renderSprayerCard(s, num) {
    var isActive = activeId === s.id ? ' active' : '';
    return '<div class="appdir-card' + isActive + '" data-id="' + s.id + '">' +
      '<div class="appdir-card-number sprayer">' + num + '</div>' +
      '<div class="appdir-card-body">' +
      '<div class="appdir-card-header">' +
      '<span class="appdir-card-title">' + esc(s.title) + '</span>' +
      '<span class="appdir-badge sprayer">Certified</span>' +
      '</div>' +
      '<div class="appdir-card-meta">' +
      metaRow('Company', esc(s.company)) +
      metaRow('Location', esc(buildAddress(s))) +
      metaRow('Phone', telLink(s.phone)) +
      metaRow('Email', mailLink(s.email)) +
      metaRow('Cert No.', esc(s.cert_number), 'mono') +
      '</div>' +
      '</div>' +
      '</div>';
  }

  function renderHubFlatCard(h, num) {
    var isActive = activeId === h.id ? ' active' : '';
    return '<div class="appdir-card' + isActive + '" data-id="' + h.id + '">' +
      '<div class="appdir-card-number hub">' + num + '</div>' +
      '<div class="appdir-card-body">' +
      '<div class="appdir-card-header">' +
      '<span class="appdir-card-title">' + esc(h.title) + '</span>' +
      hubBadge(h) +
      sprayerCountBadge(h) +
      '</div>' +
      '<div class="appdir-card-meta">' +
      metaRow('Location', esc(buildAddress(h))) +
      metaRow('Phone', telLink(h.phone)) +
      metaRow('Email', mailLink(h.email)) +
      '</div>' +
      '</div>' +
      '</div>';
  }

  function renderHubAccordion(h, num) {
    var isActive = activeId === h.id ? ' active' : '';
    var isOpen = openHubId === h.id;
    var sprayerCount = h.sprayers ? h.sprayers.length : 0;
    var arrowClass = 'appdir-expand-arrow' + (isOpen ? ' open' : '');

    var html = '<div class="appdir-hub-group" data-hub-id="' + h.id + '">' +
      '<div class="appdir-hub-header' + isActive + '" data-hub-id="' + h.id + '">';

    if (sprayerCount > 0) {
      html += '<span class="' + arrowClass + '">▶</span>';
    } else {
      html += '<span class="appdir-expand-arrow" style="visibility:hidden">▶</span>';
    }

    html += '<div class="appdir-card-number hub">' + num + '</div>' +
      '<div class="appdir-card-body">' +
      '<div class="appdir-card-header">' +
      '<span class="appdir-card-title">' + esc(h.title) + '</span>' +
      hubBadge(h) +
      sprayerCountBadge(h) +
      '</div>' +
      '<div class="appdir-card-meta">' +
      metaRow('Location', esc(buildAddress(h))) +
      metaRow('Phone', telLink(h.phone)) +
      metaRow('Email', mailLink(h.email)) +
      '</div>' +
      '</div>' +
      '</div>';

    // Sprayer rows
    if (sprayerCount > 0) {
      html += '<div class="appdir-hub-sprayers' + (isOpen ? ' open' : '') + '">';
      h.sprayers.forEach(function (s, i) {
        var letter = toLetter(i);
        var sActive = activeId === s.id ? ' active' : '';
        html += '<div class="appdir-hub-sprayer' + sActive + '" data-id="' + s.id + '">' +
          '<span class="appdir-hub-sprayer-letter">' + letter + '</span>' +
          '<span class="appdir-hub-sprayer-name">' + esc(s.title) + '</span>' +
          '<span class="appdir-hub-sprayer-cert">' + esc(s.cert_number) + '</span>' +
          '</div>';
      });
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  // ===== Click handlers =====
  function bindCardClicks() {
    document.querySelectorAll('.appdir-card').forEach(function (card) {
      card.addEventListener('click', function () {
        activeId = parseInt(this.dataset.id);
        renderList();
        flyToItem(activeId);
      });
    });
  }

  function bindHubAccordionClicks() {
    document.querySelectorAll('.appdir-hub-header').forEach(function (header) {
      header.addEventListener('click', function (e) {
        e.stopPropagation();
        var hubId = parseInt(this.dataset.hubId);

        // Accordion: clicking a hub opens it, closes others. Clicking same hub keeps it open.
        if (openHubId !== hubId) {
          openHubId = hubId;
        }

        activeId = hubId;
        renderList();
        updateMap();
        flyToItem(hubId);
      });
    });
  }

  function bindHubSprayerClicks() {
    document.querySelectorAll('.appdir-hub-sprayer').forEach(function (row) {
      row.addEventListener('click', function (e) {
        e.stopPropagation();
        activeId = parseInt(this.dataset.id);
        renderList();
        flyToItem(activeId);
      });
    });
  }

  var uiReady = false;
  var mapReady = false;

  function initUI() {
    if (uiReady) return;
    if (!document.getElementById('appdir-list')) return;
    uiReady = true;

    document.querySelectorAll('.appdir-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.appdir-tab').forEach(function (t) { t.classList.remove('active'); });
        this.classList.add('active');
        activeTab = this.dataset.tab;
        activeId = null;
        openHubId = null;
        renderList();
        updateMap();
      });
    });

    var searchInput = document.getElementById('appdir-search');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        searchQuery = this.value.toLowerCase().trim();
        renderList();
        updateMap();
      });
    }

    renderList();
  }

  function initMap() {
    if (mapReady) return;
    var mapEl = document.getElementById('appdir-map');
    if (!mapEl || typeof google === 'undefined' || !google.maps) return;
    mapReady = true;

    map = new google.maps.Map(mapEl, {
      zoom: 4,
      center: { lat: -25.0, lng: 134.0 },
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });

    infoWindow = new google.maps.InfoWindow();
    updateMap();
  }

  var mapAttempts = 0;
  function tryInitMap() {
    if (mapReady) return;
    if (typeof google === 'undefined' || !google.maps) {
      if (++mapAttempts < 20) setTimeout(tryInitMap, 500);
      return;
    }
    initMap();
  }

  function boot() {
    initUI();
    mapAttempts = 0;
    tryInitMap();
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    boot();
  } else {
    document.addEventListener('DOMContentLoaded', boot);
  }

  // Complianz unblocks Maps after consent — no page reload needed
  document.addEventListener('cmplz_run_after_all_scripts', function () {
    mapAttempts = 0;
    tryInitMap();
  });

  if (typeof jQuery !== 'undefined') {
    jQuery(document).on('elementor/frontend/init', function () {
      if (typeof elementorFrontend !== 'undefined') {
        elementorFrontend.hooks.addAction('frontend/element_ready/shortcode.default', boot);
      }
    });
  }
})();
