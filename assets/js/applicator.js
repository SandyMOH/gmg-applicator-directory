/**
 * Applicator Directory - Cerakote-style interactions
 * v1.2.0
 */
(function () {
    'use strict';

    var markers = [];
    var map = null;
    var infoWindow = null;
    var activeIndex = -1;

    // ===== Search filter =====
    function setupSearch() {
        var input = document.getElementById('appdirSearch');
        var counter = document.getElementById('appdirVisibleCount');
        var noResults = document.getElementById('appdirNoResults');
        var list = document.getElementById('appdirList');

        if (!input) return;

        input.addEventListener('keyup', function () {
            var q = this.value.toLowerCase().trim();
            var cards = document.querySelectorAll('.appdir-card');
            var visible = 0;

            cards.forEach(function (card) {
                var index = parseInt(card.dataset.index, 10);
                var fields = [
                    card.dataset.name || '',
                    card.dataset.region || '',
                    card.dataset.suburb || '',
                    card.dataset.city || '',
                    card.dataset.state || '',
                    card.dataset.license || '',
                    card.dataset.email || ''
                ];

                var match = !q || fields.some(function (f) { return f.includes(q); });

                card.style.display = match ? '' : 'none';
                if (match) visible++;

                // Show/hide corresponding map marker
                if (markers[index]) {
                    markers[index].setMap(match ? map : null);
                }
            });

            if (counter) counter.textContent = visible;
            if (noResults) noResults.style.display = visible === 0 ? 'block' : 'none';
            if (list) list.style.display = visible === 0 ? 'none' : '';

            // Re-fit map to visible markers
            if (map && visible > 0) {
                var bounds = new google.maps.LatLngBounds();
                var hasBounds = false;
                markers.forEach(function (m) {
                    if (m && m.getMap()) {
                        bounds.extend(m.getPosition());
                        hasBounds = true;
                    }
                });
                if (hasBounds) map.fitBounds(bounds);
            }
        });
    }

    // ===== Card click → activate marker =====
    function setupCardClicks() {
        document.querySelectorAll('.appdir-card').forEach(function (card) {
            card.addEventListener('click', function () {
                var index = parseInt(this.dataset.index, 10);
                activateItem(index, true);
            });
        });
    }

    // ===== Activate a card + marker pair =====
    function activateItem(index, fromCard) {
        // Reset previous
        document.querySelectorAll('.appdir-card').forEach(function (c) {
            c.classList.remove('is-active');
        });

        // Highlight card
        var card = document.querySelector('.appdir-card[data-index="' + index + '"]');
        if (card) {
            card.classList.add('is-active');
            if (!fromCard) {
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }

        // Pan map and open info
        if (map && markers[index]) {
            var marker = markers[index];
            map.panTo(marker.getPosition());
            if (map.getZoom() < 12) map.setZoom(12);
            if (infoWindow) {
                infoWindow.setContent(marker.get('content'));
                infoWindow.open(map, marker);
            }
        }

        activeIndex = index;
    }

    // ===== Build numbered SVG marker =====
    function createNumberedMarker(number, isActive) {
        var bg = isActive ? '#2563eb' : '#1f2937';
        var svg =
            '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">' +
            '<path d="M18 0C8.1 0 0 8.1 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.1 27.9 0 18 0z" fill="' + bg + '"/>' +
            '<text x="18" y="24" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">' + number + '</text>' +
            '</svg>';

        return {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
            scaledSize: new google.maps.Size(36, 46),
            anchor: new google.maps.Point(18, 46)
        };
    }

    // ===== Initialize Google Map =====
    function initApplicatorMap() {
        var mapEl = document.getElementById('appdirMap');

        if (!mapEl) {
            setupSearch();
            setupCardClicks();
            return;
        }

        if (typeof google === 'undefined' || !google.maps) {
            mapEl.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#6b7280;padding:40px;text-align:center;"><div><p style="font-size:16px;margin:0 0 8px;">Map unavailable</p><p style="font-size:13px;margin:0;">Configure Google Maps API key in Settings → Applicator Directory</p></div></div>';
            setupSearch();
            setupCardClicks();
            return;
        }

        if (typeof applicatorData === 'undefined' || !applicatorData.length) {
            mapEl.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#6b7280;padding:40px;text-align:center;"><div><p style="font-size:16px;margin:0 0 8px;">No locations to display</p><p style="font-size:13px;margin:0;">Add a Location (Google Map field) to your applicator posts</p></div></div>';
            setupSearch();
            setupCardClicks();
            return;
        }

        map = new google.maps.Map(mapEl, {
            zoom: 5,
            center: {
                lat: parseFloat(applicatorData[0].lat),
                lng: parseFloat(applicatorData[0].lng)
            },
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            styles: [
                { featureType: 'poi', stylers: [{ visibility: 'off' }] },
                { featureType: 'transit', stylers: [{ visibility: 'off' }] }
            ]
        });

        infoWindow = new google.maps.InfoWindow();
        var bounds = new google.maps.LatLngBounds();

        applicatorData.forEach(function (item, index) {
            var position = {
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lng)
            };

            var marker = new google.maps.Marker({
                position: position,
                map: map,
                title: item.title,
                icon: createNumberedMarker(index + 1, false)
            });

            var regionHtml = item.region
                ? '<span style="display:inline-block;padding:1px 8px;font-size:10px;font-weight:600;text-transform:uppercase;background:#ecfdf5;color:#059669;border:1px solid #a7f3d0;border-radius:12px;">' + escapeHtml(item.region) + '</span>'
                : '';

            var content =
                '<div style="padding:6px;max-width:280px;font-family:inherit;">' +
                '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
                '<strong style="font-size:15px;color:#111827;">' + (index + 1) + '. ' + escapeHtml(item.title) + '</strong>' +
                regionHtml +
                '</div>' +
                (item.license ? '<p style="margin:3px 0;font-size:13px;color:#4b5563;">📜 License: ' + escapeHtml(item.license) + '</p>' : '') +
                (item.display_address ? '<p style="margin:3px 0;font-size:13px;color:#4b5563;">📍 ' + escapeHtml(item.display_address) + '</p>' : '') +
                (item.phone ? '<p style="margin:3px 0;font-size:13px;">📞 <a href="tel:' + escapeHtml(item.phone) + '" style="color:#2563eb;text-decoration:none;">' + escapeHtml(item.phone) + '</a></p>' : '') +
                (item.email ? '<p style="margin:3px 0;font-size:13px;">✉️ <a href="mailto:' + escapeHtml(item.email) + '" style="color:#2563eb;text-decoration:none;">' + escapeHtml(item.email) + '</a></p>' : '') +
                '</div>';

            marker.set('content', content);

            marker.addListener('click', function () {
                activateItem(index, false);
            });

            markers[index] = marker;
            bounds.extend(position);
        });

        if (applicatorData.length > 1) {
            map.fitBounds(bounds);
        }

        setupSearch();
        setupCardClicks();
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    if (document.readyState === 'complete') {
        initApplicatorMap();
    } else {
        window.addEventListener('load', initApplicatorMap);
    }
})();