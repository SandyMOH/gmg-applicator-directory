<?php
/**
 * Plugin Name:       Applicator Directory
 * Plugin URI:        https://thermal-xr.com
 * Description:       Certified applicator directory with 3-tab search (All / Certified Sprayers / Spray Hubs). Uses ACF + Google Maps. Shortcode: [applicator_directory]
 * Version:           2.0.0
 * Author:            Sandy Mohammad
 * License:           GPL v2 or later
 * Text Domain:       applicator-directory
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'APPDIR_VERSION', '2.0.0' );
define( 'APPDIR_PATH', plugin_dir_path( __FILE__ ) );
define( 'APPDIR_URL', plugin_dir_url( __FILE__ ) );

class Applicator_Directory {

    public function __construct() {
        // Register CPTs
        add_action( 'init', array( $this, 'register_spray_hub_cpt' ) );

        // Register shortcodes
        add_shortcode( 'applicator_directory', array( $this, 'render_shortcode' ) );
        add_shortcode( 'applicator_list', array( $this, 'render_shortcode' ) ); // backward compat

        // Assets
        add_action( 'wp_enqueue_scripts', array( $this, 'register_assets' ) );

        // Settings
        add_action( 'admin_menu', array( $this, 'add_settings_page' ) );
        add_action( 'admin_init', array( $this, 'register_settings' ) );

        // ACF Google Maps API key
        add_filter( 'acf/settings/google_api_key', function() {
            return get_option( 'appdir_google_api_key', '' );
        });
    }

    /**
     * Register the Spray Hub CPT
     */
    public function register_spray_hub_cpt() {
        $labels = array(
            'name'               => 'Spray Hubs',
            'singular_name'      => 'Spray Hub',
            'add_new'            => 'Add New Hub',
            'add_new_item'       => 'Add New Spray Hub',
            'edit_item'          => 'Edit Spray Hub',
            'new_item'           => 'New Spray Hub',
            'view_item'          => 'View Spray Hub',
            'search_items'       => 'Search Spray Hubs',
            'not_found'          => 'No spray hubs found',
            'not_found_in_trash' => 'No spray hubs found in trash',
            'menu_name'          => 'Spray Hubs',
        );

        register_post_type( 'spray_hub', array(
            'labels'       => $labels,
            'public'       => true,
            'show_in_rest' => true,
            'rest_base'    => 'spray_hub',
            'menu_icon'    => 'dashicons-building',
            'supports'     => array( 'title' ),
            'has_archive'  => false,
            'rewrite'      => array( 'slug' => 'spray-hub' ),
        ) );
    }

    /**
     * Register front-end assets
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
     * Main shortcode render
     */
    public function render_shortcode( $atts ) {
        $atts = shortcode_atts( array(
            'per_page' => -1,
        ), $atts );

        wp_enqueue_style( 'applicator-directory' );
        wp_enqueue_script( 'applicator-directory' );

        // ===== Query Certified Sprayers (applicator CPT) =====
        $sprayer_query = new WP_Query( array(
            'post_type'      => 'applicator',
            'posts_per_page' => intval( $atts['per_page'] ),
            'orderby'        => 'title',
            'order'          => 'ASC',
        ) );

        $sprayers = array();
        if ( $sprayer_query->have_posts() ) {
            while ( $sprayer_query->have_posts() ) {
                $sprayer_query->the_post();
                $location = get_field( 'location' );
                $sprayers[] = array(
                    'id'        => get_the_ID(),
                    'title'     => get_the_title(),
                    'phone'     => get_field( 'phone_number' ) ?: '',
                    'email'     => get_field( 'email' ) ?: '',
                    'region'    => get_field( 'region' ) ?: '',
                    'suburb'    => get_field( 'suburb' ) ?: '',
                    'city'      => get_field( 'city' ) ?: '',
                    'state'     => get_field( 'state' ) ?: '',
                    'post_code' => get_field( 'post_code' ) ?: '',
                    'company'   => get_field( 'company' ) ?: '',
                    'cert_number' => get_field( 'license_number' ) ?: '',
                    'cert_date' => get_field( 'certification_date' ) ?: '',
                    'lat'       => ( $location && isset( $location['lat'] ) ) ? $location['lat'] : null,
                    'lng'       => ( $location && isset( $location['lng'] ) ) ? $location['lng'] : null,
                );
            }
            wp_reset_postdata();
        }

        // ===== Query Spray Hubs (spray_hub CPT) =====
        $hub_query = new WP_Query( array(
            'post_type'      => 'applicator',  // TEMP: using applicator CPT for now
            'posts_per_page' => -1,
            'orderby'        => 'title',
            'order'          => 'ASC',
            'meta_query'     => array(), // will be updated when spray_hub CPT has data
        ) );

        // Query spray_hub CPT
        $hub_query = new WP_Query( array(
            'post_type'      => 'spray_hub',
            'posts_per_page' => -1,
            'orderby'        => 'title',
            'order'          => 'ASC',
        ) );

        $hubs = array();
        if ( $hub_query->have_posts() ) {
            while ( $hub_query->have_posts() ) {
                $hub_query->the_post();
                $location = get_field( 'location' );
                $hubs[] = array(
                    'id'        => get_the_ID(),
                    'title'     => get_the_title(),
                    'company'   => get_field( 'hub_company' ) ?: get_the_title(),
                    'phone'     => get_field( 'phone_number' ) ?: '',
                    'email'     => get_field( 'email' ) ?: '',
                    'region'    => get_field( 'region' ) ?: '',
                    'suburb'    => get_field( 'suburb' ) ?: '',
                    'city'      => get_field( 'city' ) ?: '',
                    'state'     => get_field( 'state' ) ?: '',
                    'post_code' => get_field( 'post_code' ) ?: '',
                    'is_gmg'    => get_field( 'is_gmg_hub' ) ? true : false,
                    'lat'       => ( $location && isset( $location['lat'] ) ) ? $location['lat'] : null,
                    'lng'       => ( $location && isset( $location['lng'] ) ) ? $location['lng'] : null,
                );
            }
            wp_reset_postdata();
        }

        // ===== Match sprayers to hubs (company + state) =====
        foreach ( $hubs as &$hub ) {
            $hub['sprayers'] = array();
            foreach ( $sprayers as $s ) {
                if (
                    strtolower( trim( $s['company'] ) ) === strtolower( trim( $hub['company'] ) ) &&
                    strtolower( trim( $s['state'] ) ) === strtolower( trim( $hub['state'] ) )
                ) {
                    $hub['sprayers'][] = $s;
                }
            }
        }
        unset( $hub );

        // Independent sprayers (not matched to any hub)
        $hub_companies = array();
        foreach ( $hubs as $h ) {
            $hub_companies[] = strtolower( trim( $h['company'] ) ) . '|' . strtolower( trim( $h['state'] ) );
        }
        $independents = array();
        foreach ( $sprayers as $s ) {
            $key = strtolower( trim( $s['company'] ) ) . '|' . strtolower( trim( $s['state'] ) );
            if ( ! in_array( $key, $hub_companies ) ) {
                $independents[] = $s;
            }
        }

        // Pass data to JS
        wp_localize_script( 'applicator-directory', 'appDirData', array(
            'sprayers'     => $sprayers,
            'hubs'         => $hubs,
            'independents' => $independents,
            'api_key'      => get_option( 'appdir_google_api_key', '' ) ? 'set' : 'missing',
        ) );

        // Debug comment
        $sprayer_count = count( $sprayers );
        $hub_count     = count( $hubs );
        $with_loc      = 0;
        foreach ( $sprayers as $s ) { if ( $s['lat'] ) $with_loc++; }
        foreach ( $hubs as $h ) { if ( $h['lat'] ) $with_loc++; }

        ob_start();
        echo "<!-- Applicator Directory v" . APPDIR_VERSION . " | Sprayers: {$sprayer_count} | Hubs: {$hub_count} | With location: {$with_loc} | API key: " . ( get_option( 'appdir_google_api_key', '' ) ? 'set' : 'missing' ) . " -->\n";
        include APPDIR_PATH . 'templates/applicator-list.php';
        return ob_get_clean();
    }

    /**
     * Settings page
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
                                   value="<?php echo esc_attr( get_option( 'appdir_google_api_key', '' ) ); ?>"
                                   class="regular-text">
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
            <hr>
            <h2>Shortcode</h2>
            <p>Use <code>[applicator_directory]</code> in any Divi Code Module.</p>
            <h2>Post Types</h2>
            <p><strong>Applicators</strong> (applicator) = Certified sprayers from Arlo sync</p>
            <p><strong>Spray Hubs</strong> (spray_hub) = Company branches (GPX, GMG, etc.) - enter manually</p>
            <h2>How Matching Works</h2>
            <p>Sprayers are grouped under a hub when their <strong>company name + state</strong> match a hub entry.</p>
        </div>
        <?php
    }
}

new Applicator_Directory();
