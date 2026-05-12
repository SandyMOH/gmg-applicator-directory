/**
 * Applicator Directory - Cerakote-style interactions
 */
(function () {
    'use strict';

    var markers = [];
    var map = null;
    var infoWindow = null;
    var totalCount = 0;
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
                var name = card.dataset.name || '';
                var address = card.dataset.address || '';
                var license = card.dataset.license || '';
                var email = card.dataset.email || '';

                var match = !q ||
                    name.includes(q) ||
                    address.includes(q) ||
                    license.includes(q) ||
                    email.includes(q);

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
                markers.forEach(function (m) {
                    if (m && m.getMap()) bounds.extend(m.getPosition());
                });
                if (!bounds.isEmpty()) map.fitBounds(bounds);
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
        // Reset previous active state
        document.querySelectorAll('.appdir-card').forEach(function (c) {
            c.classList.remove('is-active');
        });

        // Highlight active card
        var card = document.querySelector('.appdir-card[data-index="' + index + '"]');
        if (card) {
            card.classList.add('is-active');
            if (!fromCard) {
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }

        // Pan map and open info window
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

    // ===== Build numbered SVG marker icon =====
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
            mapEl.innerHTML = '<p style="padding:20px;text-align:center;color:#888;">Google Maps API not loaded. Configure API key in plugin settings.</p>';
            setupSearch();
            setupCardClicks();
            return;
        }

        if (typeof applicatorData === 'undefined' || !applicatorData.length) {
            mapEl.innerHTML = '<p style="padding:20px;text-align:center;color:#888;">No locations to display. Add Location to your applicators.</p>';
            setupSearch();
            setupCardClicks();
            return;
        }

        totalCount = applicatorData.length;

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
                { featureType: 'poi', stylers: [{ visibility: 'off' }] }
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

            var content =
                '<div style="padding:6px;max-width:260px;font-family:inherit;">' +
                '<h4 style="margin:0 0 8px;color:#111827;font-size:15px;">' + (index + 1) + '. ' + escapeHtml(item.title) + '</h4>' +
                (item.license ? '<p style="margin:3px 0;font-size:13px;color:#4b5563;"><strong>📜 License:</strong> ' + escapeHtml(item.license) + '</p>' : '') +
                (item.address ? '<p style="margin:3px 0;font-size:13px;color:#4b5563;"><strong>📍</strong> ' + escapeHtml(item.address) + '</p>' : '') +
                (item.phone ? '<p style="margin:3px 0;font-size:13px;"><strong>📞</strong> <a href="tel:' + escapeHtml(item.phone) + '" style="color:#2563eb;text-decoration:none;">' + escapeHtml(item.phone) + '</a></p>' : '') +
                (item.email ? '<p style="margin:3px 0;font-size:13px;"><strong>✉️</strong> <a href="mailto:' + escapeHtml(item.email) + '" style="color:#2563eb;text-decoration:none;">' + escapeHtml(item.email) + '</a></p>' : '') +
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