/**
 * Applicator Directory v2.1.0
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
  function createMarkerIcon(label, color) {
    var fontSize = String(label).length > 1 ? 11 : 13;
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
        '<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 26 16 26s16-14 16-26C32 7.2 24.8 0 16 0z" fill="' + color + '"/>' +
        '<circle cx="16" cy="16" r="11" fill="white"/>' +
        '<text x="16" y="21" text-anchor="middle" font-family="Arial" font-size="' + fontSize + '" font-weight="bold" fill="' + color + '">' + label + '</text>' +
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

    var color = type === 'hub' ? '#2563eb' : '#93d501';
    var marker = new google.maps.Marker({
      position: { lat: parseFloat(item.lat), lng: parseFloat(item.lng) },
      map: map,
      icon: createMarkerIcon(label, color),
      title: item.title,
    });

    var addr = buildAddress(item);
    var content = '<div class="appdir-popup">' +
      '<div class="appdir-popup-title">' + esc(item.title) + '</div>' +
      (addr ? '<div class="appdir-popup-row"><span class="p-ico">📍</span><span>' + esc(addr) + '</span></div>' : '') +
      (item.phone ? '<div class="appdir-popup-row"><span class="p-ico">📞</span><span>' + esc(item.phone) + '</span></div>' : '') +
      (item.email ? '<div class="appdir-popup-row"><span class="p-ico">✉️</span><span>' + esc(item.email) + '</span></div>' : '') +
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
    var m = markers.find(function (mk) { return mk._itemId === id; });
    if (m) {
      map.panTo(m.getPosition());
      map.setZoom(12);
      google.maps.event.trigger(m, 'click');
    }
  }

  // ===== Update map markers based on current tab + state =====
  function updateMap() {
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
  function renderSprayerCard(s, num) {
    var addr = buildAddress(s);
    var isActive = activeId === s.id ? ' active' : '';
    return '<div class="appdir-card' + isActive + '" data-id="' + s.id + '">' +
      '<div class="appdir-card-number sprayer">' + num + '</div>' +
      '<div class="appdir-card-body">' +
      '<div class="appdir-card-header">' +
      '<span class="appdir-card-title">' + esc(s.title) + '</span>' +
      '<span class="appdir-badge sprayer">Certified</span>' +
      '</div>' +
      (s.company ? '<div class="appdir-card-row"><span class="ico">🏢</span><span>' + esc(s.company) + '</span></div>' : '') +
      (addr ? '<div class="appdir-card-row"><span class="ico">📍</span><span>' + esc(addr) + '</span></div>' : '') +
      (s.phone ? '<div class="appdir-card-row"><span class="ico">📞</span><a href="tel:' + esc(s.phone) + '">' + esc(s.phone) + '</a></div>' : '') +
      (s.cert_number ? '<span class="appdir-card-cert">📜 ' + esc(s.cert_number) + '</span>' : '') +
      '</div>' +
      '</div>';
  }

  function renderHubFlatCard(h, num) {
    var addr = buildAddress(h);
    var isActive = activeId === h.id ? ' active' : '';
    var badgeClass = h.is_gmg ? 'gmg' : 'hub';
    var badgeText = h.is_gmg ? 'GMG Hub' : 'Spray Hub';
    return '<div class="appdir-card' + isActive + '" data-id="' + h.id + '">' +
      '<div class="appdir-card-number hub">' + num + '</div>' +
      '<div class="appdir-card-body">' +
      '<div class="appdir-card-header">' +
      '<span class="appdir-card-title">' + esc(h.title) + '</span>' +
      '<span class="appdir-badge ' + badgeClass + '">' + badgeText + '</span>' +
      '</div>' +
      (addr ? '<div class="appdir-card-row"><span class="ico">📍</span><span>' + esc(addr) + '</span></div>' : '') +
      (h.phone ? '<div class="appdir-card-row"><span class="ico">📞</span><a href="tel:' + esc(h.phone) + '">' + esc(h.phone) + '</a></div>' : '') +
      (h.email ? '<div class="appdir-card-row"><span class="ico">✉️</span><a href="mailto:' + esc(h.email) + '">' + esc(h.email) + '</a></div>' : '') +
      '</div>' +
      '</div>';
  }

  function renderHubAccordion(h, num) {
    var addr = buildAddress(h);
    var isActive = activeId === h.id ? ' active' : '';
    var isOpen = openHubId === h.id;
    var badgeClass = h.is_gmg ? 'gmg' : 'hub';
    var badgeText = h.is_gmg ? 'GMG Hub' : 'Spray Hub';
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
      '<span class="appdir-badge ' + badgeClass + '">' + badgeText + '</span>' +
      (sprayerCount > 0 ? '<span class="appdir-badge count">' + sprayerCount + ' sprayer' + (sprayerCount !== 1 ? 's' : '') + '</span>' : '') +
      '</div>' +
      (addr ? '<div class="appdir-card-row"><span class="ico">📍</span><span>' + esc(addr) + '</span></div>' : '') +
      (h.phone ? '<div class="appdir-card-row"><span class="ico">📞</span><a href="tel:' + esc(h.phone) + '">' + esc(h.phone) + '</a></div>' : '') +
      (h.email ? '<div class="appdir-card-row"><span class="ico">✉️</span><a href="mailto:' + esc(h.email) + '">' + esc(h.email) + '</a></div>' : '') +
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

  // ===== Init =====
  var initialized = false;

  function init() {
    var mapEl = document.getElementById('appdir-map');
    if (!mapEl || typeof google === 'undefined' || !google.maps) {
      console.warn('Applicator Directory: Google Maps API not loaded.');
      return;
    }

    // Prevent double initialization
    if (initialized) return;
    initialized = true;

    map = new google.maps.Map(mapEl, {
      zoom: 4,
      center: { lat: -25.0, lng: 134.0 },
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });

    infoWindow = new google.maps.InfoWindow();

    // Tab clicks
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

    // Search
    var searchInput = document.getElementById('appdir-search');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        searchQuery = this.value.toLowerCase().trim();
        renderList();
        updateMap();
      });
    }

    // Initial render
    renderList();
    updateMap();
  }

  // Start — handles normal page load, Elementor editor (AJAX), and Elementor frontend
  var tryInitAttempts = 0;

  function tryInit() {
    // Wait for Google Maps to be available
    if (typeof google === 'undefined' || !google.maps) {
      // Retry up to 10 times (5 seconds) in case scripts are still loading (Elementor AJAX)
      tryInitAttempts++;
      if (tryInitAttempts < 10) {
        setTimeout(tryInit, 500);
      }
      return;
    }
    var mapEl = document.getElementById('appdir-map');
    if (mapEl) {
      init();
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    tryInit();
  } else {
    window.addEventListener('load', tryInit);
  }

  // Re-init when Elementor renders the widget via AJAX (editor preview)
  if (typeof jQuery !== 'undefined') {
    jQuery(document).on('elementor/frontend/init', function () {
      if (typeof elementorFrontend !== 'undefined') {
        elementorFrontend.hooks.addAction('frontend/element_ready/shortcode.default', function () {
          tryInit();
        });
      }
    });
  }

  // Also listen for generic Elementor widget render events
  document.addEventListener('DOMContentLoaded', tryInit);
})();
