<?php
/**
 * Plugin Name:       Applicator Directory
 * Plugin URI:        https://github.com/SandyMOH/gmg-applicator-directory
 * Description:       Displays a searchable list and map of applicators using ACF fields. Use shortcode [applicator_list].
 * Version:           1.2.0
 * Author:            Sandy Mohammad
 * License:           GPL v2 or later
 * Text Domain:       applicator-directory
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'APPDIR_VERSION', '1.2.0' );
define( 'APPDIR_PATH', plugin_dir_path( __FILE__ ) );
define( 'APPDIR_URL', plugin_dir_url( __FILE__ ) );

class Applicator_Directory {

    public function __construct() {
        add_shortcode( 'applicator_list', array( $this, 'render_shortcode' ) );
        add_action( 'wp_enqueue_scripts', array( $this, 'register_assets' ) );
        add_action( 'admin_menu', array( $this, 'add_settings_page' ) );
        add_action( 'admin_init', array( $this, 'register_settings' ) );
        add_filter( 'acf/settings/google_api_key', array( $this, 'acf_google_api_key' ) );
    }

    public function acf_google_api_key() {
        return get_option( 'appdir_google_api_key', '' );
    }

    public function register_assets() {
        wp_register_style( 'applicator-directory', APPDIR_URL . 'assets/css/applicator.css', array(), APPDIR_VERSION );

        $api_key = get_option( 'appdir_google_api_key', '' );

        if ( ! empty( $api_key ) ) {
            wp_register_script(
                'google-maps-api',
                'https://maps.googleapis.com/maps/api/js?key=' . esc_attr( $api_key ) . '&libraries=places',
                array(),
                null,
                true
            );
        }

        $deps = ! empty( $api_key ) ? array( 'google-maps-api' ) : array();
        wp_register_script(
            'applicator-directory',
            APPDIR_URL . 'assets/js/applicator.js',
            $deps,
            APPDIR_VERSION,
            true
        );
    }

    public function render_shortcode( $atts ) {
        $atts = shortcode_atts( array(
            'post_type'   => 'applicator',
            'per_page'    => -1,
            'orderby'     => 'title',
            'order'       => 'ASC',
            'show_map'    => 'yes',
            'show_search' => 'yes',
        ), $atts, 'applicator_list' );

        wp_enqueue_style( 'applicator-directory' );
        wp_enqueue_script( 'applicator-directory' );

        $query = new WP_Query( array(
            'post_type'      => sanitize_text_field( $atts['post_type'] ),
            'posts_per_page' => intval( $atts['per_page'] ),
            'orderby'        => sanitize_text_field( $atts['orderby'] ),
            'order'          => sanitize_text_field( $atts['order'] ),
        ) );

        $applicators = array();
        $map_data    = array();

        if ( $query->have_posts() ) {
            while ( $query->have_posts() ) {
                $query->the_post();

                $phone      = get_field( 'phone_number' );
                $license    = get_field( 'license_number' );
                $email      = get_field( 'email' );
                $region     = get_field( 'region' );
                $suburb     = get_field( 'suburb' );
                $city       = get_field( 'city' );
                $state      = get_field( 'state' );
                $post_code  = get_field( 'post_code' );
                $location   = get_field( 'location' );

                // Build public display address (suburb, state, postcode — NO street address)
                $display_parts = array_filter( array( $suburb, $city, $state, $post_code ) );
                $display_address = implode( ', ', $display_parts );

                $applicators[] = array(
                    'title'           => get_the_title(),
                    'phone'           => $phone,
                    'license'         => $license,
                    'email'           => $email,
                    'region'          => $region,
                    'suburb'          => $suburb,
                    'city'            => $city,
                    'state'           => $state,
                    'post_code'       => $post_code,
                    'display_address' => $display_address,
                );

                if ( $location && isset( $location['lat'], $location['lng'] ) ) {
                    $map_data[] = array(
                        'title'           => get_the_title(),
                        'phone'           => $phone,
                        'license'         => $license,
                        'email'           => $email,
                        'region'          => $region,
                        'display_address' => $display_address,
                        'lat'             => $location['lat'],
                        'lng'             => $location['lng'],
                    );
                }
            }
            wp_reset_postdata();
        }

        wp_localize_script( 'applicator-directory', 'applicatorData', $map_data );

        $debug = '<!-- Applicator Directory v' . APPDIR_VERSION . ' | Applicators: ' . count($applicators) . ' | With location: ' . count($map_data) . ' | API key: ' . ( get_option('appdir_google_api_key') ? 'set' : 'missing' ) . ' -->';

        ob_start();
        echo $debug;
        include APPDIR_PATH . 'templates/applicator-list.php';
        return ob_get_clean();
    }

    public function add_settings_page() {
        add_options_page( 'Applicator Directory', 'Applicator Directory', 'manage_options', 'applicator-directory', array( $this, 'render_settings_page' ) );
    }

    public function register_settings() {
        register_setting( 'appdir_settings', 'appdir_google_api_key' );
    }

    public function render_settings_page() {
        ?>
        <div class="wrap">
            <h1>Applicator Directory Settings</h1>
            <form method="post" action="options.php">
                <?php settings_fields( 'appdir_settings' ); ?>
                <table class="form-table">
                    <tr>
                        <th><label for="appdir_google_api_key">Google Maps API Key</label></th>
                        <td>
                            <input type="text" name="appdir_google_api_key" id="appdir_google_api_key"
                                value="<?php echo esc_attr( get_option( 'appdir_google_api_key', '' ) ); ?>" class="regular-text">
                            <p class="description">Required APIs: Maps JavaScript API, Places API, Geocoding API. Get a key from <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a>.</p>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>

            <hr>
            <h2>Usage</h2>
            <p>Shortcode: <code>[applicator_list]</code></p>

            <h3>ACF Field Reference</h3>
            <table class="wp-list-table widefat fixed striped">
                <thead><tr><th>Field Name</th><th>Type</th><th>Shown on Frontend</th></tr></thead>
                <tbody>
                    <tr><td><code>license_number</code></td><td>Text</td><td>Yes</td></tr>
                    <tr><td><code>phone_number</code></td><td>Text</td><td>Yes</td></tr>
                    <tr><td><code>email</code></td><td>Email</td><td>Yes</td></tr>
                    <tr><td><code>region</code></td><td>Text</td><td>Yes (badge)</td></tr>
                    <tr><td><code>suburb</code></td><td>Text</td><td>Yes</td></tr>
                    <tr><td><code>city</code></td><td>Text</td><td>Yes</td></tr>
                    <tr><td><code>state</code></td><td>Text</td><td>Yes</td></tr>
                    <tr><td><code>post_code</code></td><td>Text</td><td>Yes</td></tr>
                    <tr><td><code>street_address</code></td><td>Text</td><td>⛔ PRIVATE — never shown</td></tr>
                    <tr><td><code>location</code></td><td>Google Map</td><td>Yes (map pin)</td></tr>
                </tbody>
            </table>
            <p>Version: <strong><?php echo APPDIR_VERSION; ?></strong></p>
        </div>
        <?php
    }
}

new Applicator_Directory();