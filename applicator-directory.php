<?php
/**
 * Plugin Name:       Applicator Directory
 * Plugin URI:        https://yoursite.com
 * Description:       Displays a searchable list and map of applicators using ACF fields. Use shortcode [applicator_list] to display.
 * Version:           1.0.0
 * Author:            Your Name
 * License:           GPL v2 or later
 * Text Domain:       applicator-directory
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Define plugin constants
define( 'APPDIR_VERSION', '1.0.0' );
define( 'APPDIR_PATH', plugin_dir_path( __FILE__ ) );
define( 'APPDIR_URL', plugin_dir_url( __FILE__ ) );

/**
 * Main Plugin Class
 */
class Applicator_Directory {

    public function __construct() {
        // Register shortcode
        add_shortcode( 'applicator_list', array( $this, 'render_shortcode' ) );

        // Enqueue assets only when shortcode is used
        add_action( 'wp_enqueue_scripts', array( $this, 'register_assets' ) );

        // Add settings page
        add_action( 'admin_menu', array( $this, 'add_settings_page' ) );
        add_action( 'admin_init', array( $this, 'register_settings' ) );
    }

    /**
     * Register assets (will be enqueued only when shortcode runs)
     */
    public function register_assets() {
        wp_register_style(
            'applicator-directory',
            APPDIR_URL . 'assets/css/applicator.css',
            array(),
            APPDIR_VERSION
        );

        $api_key = get_option( 'appdir_google_api_key', '' );

        if ( ! empty( $api_key ) ) {
            wp_register_script(
                'google-maps-api',
                'https://maps.googleapis.com/maps/api/js?key=' . esc_attr( $api_key ),
                array(),
                null,
                true
            );
        }

        wp_register_script(
            'applicator-directory',
            APPDIR_URL . 'assets/js/applicator.js',
            array( 'google-maps-api' ),
            APPDIR_VERSION,
            true
        );
    }

    /**
     * Render the shortcode
     */
    public function render_shortcode( $atts ) {
        $atts = shortcode_atts( array(
            'post_type'   => 'applicator',
            'per_page'    => -1,
            'orderby'     => 'title',
            'order'       => 'ASC',
            'show_map'    => 'yes',
            'show_search' => 'yes',
        ), $atts, 'applicator_list' );

        // Enqueue assets
        wp_enqueue_style( 'applicator-directory' );
        wp_enqueue_script( 'applicator-directory' );

        // Query applicators
        $query = new WP_Query( array(
            'post_type'      => sanitize_text_field( $atts['post_type'] ),
            'posts_per_page' => intval( $atts['per_page'] ),
            'orderby'        => sanitize_text_field( $atts['orderby'] ),
            'order'          => sanitize_text_field( $atts['order'] ),
        ) );

        // Build data array for map
        $applicators = array();
        $map_data    = array();

        if ( $query->have_posts() ) {
            while ( $query->have_posts() ) {
                $query->the_post();

                $phone    = get_field( 'phone_number' );
                $cert     = get_field( 'certificate_number' );
                $address  = get_field( 'address' );
                $location = get_field( 'location' );

                $applicators[] = array(
                    'title'    => get_the_title(),
                    'phone'    => $phone,
                    'cert'     => $cert,
                    'address'  => $address,
                    'location' => $location,
                );

                if ( $location && isset( $location['lat'], $location['lng'] ) ) {
                    $map_data[] = array(
                        'title'   => get_the_title(),
                        'phone'   => $phone,
                        'cert'    => $cert,
                        'address' => $address,
                        'lat'     => $location['lat'],
                        'lng'     => $location['lng'],
                    );
                }
            }
            wp_reset_postdata();
        }

        // Pass data to JS
        wp_localize_script( 'applicator-directory', 'applicatorData', $map_data );

        // Load template
        ob_start();
        include APPDIR_PATH . 'templates/applicator-list.php';
        return ob_get_clean();
    }

    /**
     * Add settings page under Settings menu
     */
    public function add_settings_page() {
        add_options_page(
            'Applicator Directory Settings',
            'Applicator Directory',
            'manage_options',
            'applicator-directory',
            array( $this, 'render_settings_page' )
        );
    }

    /**
     * Register settings
     */
    public function register_settings() {
        register_setting( 'appdir_settings', 'appdir_google_api_key' );
    }

    /**
     * Settings page output
     */
    public function render_settings_page() {
        ?>
        <div class="wrap">
            <h1>Applicator Directory Settings</h1>
            <form method="post" action="options.php">
                <?php settings_fields( 'appdir_settings' ); ?>
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="appdir_google_api_key">Google Maps API Key</label>
                        </th>
                        <td>
                            <input type="text"
                                   name="appdir_google_api_key"
                                   id="appdir_google_api_key"
                                   value="<?php echo esc_attr( get_option( 'appdir_google_api_key', '' ) ); ?>"
                                   class="regular-text">
                            <p class="description">
                                Get your API key from
                                <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a>.
                                Enable "Maps JavaScript API".
                            </p>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>

            <hr>

            <h2>How to use</h2>
            <p>Insert this shortcode in any Divi Code/Text module or page content:</p>
            <code>[applicator_list]</code>

            <h3>Shortcode parameters (optional)</h3>
            <ul>
                <li><code>post_type</code> – CPT slug (default: <code>applicator</code>)</li>
                <li><code>per_page</code> – Number to show (default: <code>-1</code> for all)</li>
                <li><code>orderby</code> – Sort by (default: <code>title</code>)</li>
                <li><code>order</code> – ASC or DESC (default: <code>ASC</code>)</li>
                <li><code>show_map</code> – yes/no (default: <code>yes</code>)</li>
                <li><code>show_search</code> – yes/no (default: <code>yes</code>)</li>
            </ul>
            <p>Example: <code>[applicator_list post_type="aplikator" show_map="no"]</code></p>
        </div>
        <?php
    }
}

new Applicator_Directory();
