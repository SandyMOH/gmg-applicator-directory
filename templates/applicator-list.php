<?php if ( ! defined( 'ABSPATH' ) ) exit; ?>

<div id="appdir-wrapper" class="appdir-wrapper">

    <!-- Tabs -->
    <div class="appdir-tabs">
        <button class="appdir-tab active" data-tab="all">
            All <span class="appdir-tab-count" id="count-all">0</span>
        </button>
        <button class="appdir-tab" data-tab="sprayers">
            Certified Sprayers <span class="appdir-tab-count" id="count-sprayers">0</span>
        </button>
        <button class="appdir-tab" data-tab="hubs">
            Spray Hubs <span class="appdir-tab-count" id="count-hubs">0</span>
        </button>
    </div>

    <!-- Toolbar -->
    <div class="appdir-toolbar">
        <div class="appdir-search-wrap">
            <svg class="appdir-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" id="appdir-search" class="appdir-search"
                   placeholder="Search by name, company, city, or certification number...">
        </div>
        <div class="appdir-results-count" id="appdir-results-count"></div>
    </div>

    <!-- Layout: list + map -->
    <div class="appdir-layout">
        <div class="appdir-list-panel">
            <div class="appdir-list-scroll" id="appdir-list"></div>
        </div>
        <div class="appdir-map-panel">
            <div id="appdir-map" style="width:100%;height:100%;"></div>

            <!-- Shown only while Google Maps is blocked by the cookie banner.
                 Hidden by default so it never flashes when consent is already
                 stored; applicator.js unhides it once it knows consent is
                 missing. Sits alongside #appdir-map rather than inside it, so
                 Google Maps keeps sole ownership of that container's DOM. -->
            <div id="appdir-map-consent" class="appdir-map-consent" hidden>
                <div class="appdir-map-consent-inner">
                    <svg class="appdir-map-consent-icon" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <h3 class="appdir-map-consent-title">Map needs marketing cookies</h3>
                    <p class="appdir-map-consent-text">
                        This map is loaded from Google Maps, which we only load once you
                        accept marketing cookies. Every listing is still available in the
                        panel beside it.
                    </p>
                    <button type="button" class="appdir-map-consent-btn cmplz-manage-consent">
                        Cookie preferences
                    </button>
                </div>
            </div>
        </div>
    </div>

</div>
