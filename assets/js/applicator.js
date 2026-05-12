/**
 * Applicator Directory - Frontend Script
 */
(function () {
    'use strict';

    // ===== Search filter =====
    var searchInput = document.getElementById('applicatorSearch');
    if (searchInput) {
        searchInput.addEventListener('keyup', function () {
            var q = this.value.toLowerCase().trim();
            var cards = document.querySelectorAll('.applicator-card');

            cards.forEach(function (card) {
                var name = card.dataset.name || '';
                var address = card.dataset.address || '';
                var license = card.dataset.license || '';
                var email = card.dataset.email || '';
                var match = name.includes(q) || address.includes(q) || license.includes(q) || email.includes(q);
                card.style.display = match ? '' : 'none';
            });
        });
    }

    // ===== Initialize Google Map =====
    function initApplicatorMap() {
        var mapEl = document.getElementById('applicatorMap');
        if (!mapEl) return;
        if (typeof google === 'undefined' || !google.maps) {
            console.warn('Google Maps API not loaded. Add API key in Settings > Applicator Directory.');
            return;
        }
        if (typeof applicatorData === 'undefined' || !applicatorData.length) {
            mapEl.innerHTML = '<p style="padding:20px;text-align:center;">No locations to display.</p>';
            return;
        }

        var map = new google.maps.Map(mapEl, {
            zoom: 5,
            center: {
                lat: parseFloat(applicatorData[0].lat),
                lng: parseFloat(applicatorData[0].lng)
            },
            mapTypeControl: true,
            streetViewControl: false
        });

        var bounds = new google.maps.LatLngBounds();
        var infoWindow = new google.maps.InfoWindow();

        applicatorData.forEach(function (item) {
            var position = {
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lng)
            };

            var marker = new google.maps.Marker({
                position: position,
                map: map,
                title: item.title
            });

            var content =
                '<div style="padding:8px;max-width:260px;font-family:inherit;">' +
                '<h4 style="margin:0 0 8px;color:#2c3e50;">' + escapeHtml(item.title) + '</h4>' +
                (item.license ? '<p style="margin:3px 0;font-size:13px;"><strong>📜</strong> ' + escapeHtml(item.license) + '</p>' : '') +
                (item.phone ? '<p style="margin:3px 0;font-size:13px;"><strong>📞</strong> ' + escapeHtml(item.phone) + '</p>' : '') +
                (item.email ? '<p style="margin:3px 0;font-size:13px;"><strong>✉️</strong> <a href="mailto:' + escapeHtml(item.email) + '">' + escapeHtml(item.email) + '</a></p>' : '') +
                (item.address ? '<p style="margin:3px 0;font-size:13px;"><strong>📍</strong> ' + escapeHtml(item.address) + '</p>' : '') +
                '</div>';

            marker.addListener('click', function () {
                infoWindow.setContent(content);
                infoWindow.open(map, marker);
            });

            bounds.extend(position);
        });

        if (applicatorData.length > 1) {
            map.fitBounds(bounds);
        }
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