<?php
/**
 * Applicator List Template - Cerakote-style with region/suburb/city/state
 */

if ( ! defined( 'ABSPATH' ) ) exit;
?>

<div class="appdir-container">

    <?php if ( $atts['show_search'] === 'yes' ) : ?>
        <div class="appdir-toolbar">
            <div class="appdir-search-wrap">
                <svg class="appdir-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input type="text" id="appdirSearch" placeholder="Search by name, region, city, suburb, or license...">
            </div>
            <div class="appdir-results-count">
                Showing <span id="appdirVisibleCount"><?php echo count( $applicators ); ?></span> of <?php echo count( $applicators ); ?> applicators
            </div>
        </div>
    <?php endif; ?>

    <div class="appdir-layout">

        <!-- LEFT: Scrollable list -->
        <div class="appdir-list-panel">
            <?php if ( ! empty( $applicators ) ) : ?>
                <div class="appdir-list" id="appdirList">
                    <?php foreach ( $applicators as $index => $app ) : ?>
                        <div class="appdir-card"
                             data-index="<?php echo $index; ?>"
                             data-name="<?php echo esc_attr( strtolower( $app['title'] ) ); ?>"
                             data-region="<?php echo esc_attr( strtolower( $app['region'] ) ); ?>"
                             data-suburb="<?php echo esc_attr( strtolower( $app['suburb'] ) ); ?>"
                             data-city="<?php echo esc_attr( strtolower( $app['city'] ) ); ?>"
                             data-state="<?php echo esc_attr( strtolower( $app['state'] ) ); ?>"
                             data-license="<?php echo esc_attr( strtolower( $app['license'] ) ); ?>"
                             data-email="<?php echo esc_attr( strtolower( $app['email'] ) ); ?>">

                            <div class="appdir-card-number"><?php echo $index + 1; ?></div>

                            <div class="appdir-card-body">
                                <div class="appdir-card-header">
                                    <h3 class="appdir-card-title"><?php echo esc_html( $app['title'] ); ?></h3>
                                    <?php if ( $app['region'] ) : ?>
                                        <span class="appdir-region-badge"><?php echo esc_html( $app['region'] ); ?></span>
                                    <?php endif; ?>
                                </div>

                                <?php if ( $app['license'] ) : ?>
                                    <div class="appdir-card-row">
                                        <span class="appdir-card-icon">📜</span>
                                        <span>License: <?php echo esc_html( $app['license'] ); ?></span>
                                    </div>
                                <?php endif; ?>

                                <?php if ( $app['display_address'] ) : ?>
                                    <div class="appdir-card-row">
                                        <span class="appdir-card-icon">📍</span>
                                        <span><?php echo esc_html( $app['display_address'] ); ?></span>
                                    </div>
                                <?php endif; ?>

                                <?php if ( $app['phone'] ) : ?>
                                    <div class="appdir-card-row">
                                        <span class="appdir-card-icon">📞</span>
                                        <a href="tel:<?php echo esc_attr( $app['phone'] ); ?>"><?php echo esc_html( $app['phone'] ); ?></a>
                                    </div>
                                <?php endif; ?>

                                <?php if ( $app['email'] ) : ?>
                                    <div class="appdir-card-row">
                                        <span class="appdir-card-icon">✉️</span>
                                        <a href="mailto:<?php echo esc_attr( $app['email'] ); ?>"><?php echo esc_html( $app['email'] ); ?></a>
                                    </div>
                                <?php endif; ?>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
                <div class="appdir-no-results" id="appdirNoResults" style="display:none;">
                    <p>No applicators match your search.</p>
                </div>
            <?php else : ?>
                <div class="appdir-no-results">
                    <p>No applicators found.</p>
                </div>
            <?php endif; ?>
        </div>

        <!-- RIGHT: Map -->
        <?php if ( $atts['show_map'] === 'yes' ) : ?>
            <div class="appdir-map-panel">
                <div id="appdirMap" class="appdir-map"></div>
            </div>
        <?php endif; ?>

    </div>
</div>