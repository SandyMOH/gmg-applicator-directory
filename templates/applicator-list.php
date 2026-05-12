<?php
/**
 * Applicator List Template
 */

if ( ! defined( 'ABSPATH' ) ) exit;
?>

<div class="applicator-wrapper">

    <?php if ( $atts['show_search'] === 'yes' ) : ?>
        <div class="applicator-search">
            <input type="text" 
                   id="applicatorSearch" 
                   placeholder="Search by name, address, license number, or email...">
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
                     data-license="<?php echo esc_attr( strtolower( $app['license'] ) ); ?>"
                     data-email="<?php echo esc_attr( strtolower( $app['email'] ) ); ?>">
                    <h3><?php echo esc_html( $app['title'] ); ?></h3>
                    <?php if ( $app['license'] ) : ?>
                        <p><span class="app-label">📜 License:</span> <?php echo esc_html( $app['license'] ); ?></p>
                    <?php endif; ?>
                    <?php if ( $app['phone'] ) : ?>
                        <p><span class="app-label">📞 Phone:</span> <?php echo esc_html( $app['phone'] ); ?></p>
                    <?php endif; ?>
                    <?php if ( $app['email'] ) : ?>
                        <p><span class="app-label">✉️ Email:</span> <a href="mailto:<?php echo esc_attr( $app['email'] ); ?>"><?php echo esc_html( $app['email'] ); ?></a></p>
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