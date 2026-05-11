<?php
/**
 * Applicator List Template
 * 
 * Available variables:
 * $applicators - array of all applicators
 * $map_data    - array of applicators with valid coordinates
 * $atts        - shortcode attributes
 */

if ( ! defined( 'ABSPATH' ) ) exit;
?>

<div class="applicator-wrapper">

    <?php if ( $atts['show_search'] === 'yes' ) : ?>
        <div class="applicator-search">
            <input type="text" 
                   id="applicatorSearch" 
                   placeholder="Search by name, address, or certificate number...">
        </div>
    <?php endif; ?>

    <?php if ( $atts['show_map'] === 'yes' && ! empty( $map_data ) ) : ?>
        <div id="applicatorMap" class="applicator-map"></div>
    <?php endif; ?>

    <?php if ( ! empty( $applicators ) ) : ?>
        <div class="applicator-list">
            <?php foreach ( $applicators as $app ) : ?>
                <div class="applicator-card"
                     data-name="<?php echo esc_attr( strtolower( $app['title'] ) ); ?>"
                     data-address="<?php echo esc_attr( strtolower( $app['address'] ) ); ?>"
                     data-cert="<?php echo esc_attr( strtolower( $app['cert'] ) ); ?>">
                    <h3><?php echo esc_html( $app['title'] ); ?></h3>
                    <?php if ( $app['phone'] ) : ?>
                        <p><span class="app-label">📞 Phone:</span> <?php echo esc_html( $app['phone'] ); ?></p>
                    <?php endif; ?>
                    <?php if ( $app['cert'] ) : ?>
                        <p><span class="app-label">📜 Certificate:</span> <?php echo esc_html( $app['cert'] ); ?></p>
                    <?php endif; ?>
                    <?php if ( $app['address'] ) : ?>
                        <p><span class="app-label">📍 Address:</span> <?php echo esc_html( $app['address'] ); ?></p>
                    <?php endif; ?>
                </div>
            <?php endforeach; ?>
        </div>
    <?php else : ?>
        <p class="applicator-empty">No applicators found.</p>
    <?php endif; ?>

</div>
