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
        </div>
    </div>

</div>
