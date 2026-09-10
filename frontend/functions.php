<?php
/**
 * Domain Reseller Platform – functions.php
 * Theme = presentation only. Registrar/billing logic stays in plugin (see docs/API-INTEGRATION.md).
 */

if (!defined('ABSPATH')) exit;

define('DOMAIN_PLATFORM_VERSION', '1.0.0');

// Theme setup
add_action('after_setup_theme', function () {
    add_theme_support('title-tag');
    add_theme_support('html5', ['search-form','gallery','caption','style','script']);
    add_theme_support('post-thumbnails');
    add_theme_support('responsive-embeds');
    add_theme_support('automatic-feed-links');
    // Keep HTML5 semantics for WP core; Tailwind handles styling
    register_nav_menus([
        'primary'        => __('Primary Menu', 'domain-platform'),
        'footer-domains' => __('Footer – Domains', 'domain-platform'),
        'footer-support' => __('Footer – Support', 'domain-platform'),
        'footer-legal'   => __('Footer – Legal', 'domain-platform'),
    ]);
    load_theme_textdomain('domain-platform', get_template_directory() . '/languages');
});

// Widgets (footer + future dashboard widgets)
add_action('widgets_init', function () {
    register_sidebar([
        'name'          => __('Footer 1', 'domain-platform'),
        'id'            => 'footer-1',
        'before_widget' => '<div class="mt-4">',
        'after_widget'  => '</div>',
        'before_title'  => '<h4 class="font-semibold">',
        'after_title'   => '</h4>',
    ]);
});

// Enqueue – NO hardcoded <link>/<script> in templates
add_action('wp_enqueue_scripts', function () {
    // Base theme stylesheet (required header) – keep minimal; real styles from Tailwind build
    wp_enqueue_style('domain-platform-style', get_stylesheet_uri(), [], DOMAIN_PLATFORM_VERSION);

    // Tailwind build output – generate via: npm install && npm run build (css/input.css -> css/output.css)
    $output_path = get_template_directory() . '/css/output.css';
    $output_uri  = get_template_directory_uri() . '/css/output.css';
    if (file_exists($output_path)) {
        wp_enqueue_style('domain-platform-tailwind', $output_uri, ['domain-platform-style'], filemtime($output_path));
    } else {
        // Fallback during static preview: input.css + CDN is used in static HTML files;
        // in WordPress, prefer the built output – log notice if missing
        if (is_user_logged_in() && current_user_can('manage_options')) {
            // admin notice is handled elsewhere; just avoid 404
        }
    }

    // Shared theme: semantic colors, dark mode, components, focus + motion
    wp_enqueue_style('domain-platform-theme', get_template_directory_uri() . '/css/theme.css', ['domain-platform-style'], DOMAIN_PLATFORM_VERSION);

    // Fonts – enqueue properly instead of hardcoded <link> in header
    wp_enqueue_style('domain-platform-fonts', 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap', [], null);

    // Scripts – defer via 'in_footer' true, no hardcoded <script> tags in templates
    wp_enqueue_script('domain-platform-mock', get_template_directory_uri() . '/js/mock-data.js', [], DOMAIN_PLATFORM_VERSION, true);
    wp_enqueue_script('domain-platform-cart', get_template_directory_uri() . '/js/cart.js', ['domain-platform-mock'], DOMAIN_PLATFORM_VERSION, true);
    wp_enqueue_script('domain-platform-navigation', get_template_directory_uri() . '/js/navigation.js', [], DOMAIN_PLATFORM_VERSION, true);
    wp_enqueue_script('domain-platform-domain-search', get_template_directory_uri() . '/js/domain-search.js', ['domain-platform-mock','domain-platform-cart'], DOMAIN_PLATFORM_VERSION, true);
    wp_enqueue_script('domain-platform-ui', get_template_directory_uri() . '/js/ui.js', [], DOMAIN_PLATFORM_VERSION, true);
    wp_enqueue_script('domain-platform-main', get_template_directory_uri() . '/js/main.js', ['domain-platform-navigation','domain-platform-ui','domain-platform-domain-search','domain-platform-cart'], DOMAIN_PLATFORM_VERSION, true);

    // Pass home URL / API root for future real integration (no secrets)
    wp_add_inline_script('domain-platform-main',
        'window.DOMAIN_PLATFORM = ' . wp_json_encode([
            'homeUrl' => home_url('/'),
            'apiRoot' => esc_url_raw(rest_url('domain-platform/v1')),
            'nonce'   => wp_create_nonce('wp_rest'),
        ]) . ';',
        'before'
    );

    if (is_singular() && comments_open() && get_option('thread_comments')) {
        wp_enqueue_script('comment-reply');
    }
});

// Custom walker to match Tailwind nav styles (keeps BEM minimal)
class Domain_Platform_Walker extends Walker_Nav_Menu {
    public function start_el(&$output, $data_object, $depth = 0, $args = null, $current_object_id = 0) {
        $classes = empty($data_object->classes) ? [] : (array) $data_object->classes;
        $is_active = in_array('current-menu-item', $classes) || in_array('current_page_item', $classes);
        $class = $is_active ? 'px-3 py-2 rounded-lg bg-nav-hover text-label' : 'px-3 py-2 rounded-lg hover:bg-system-fill hover:text-label';
        $output .= '<a href="' . esc_url($data_object->url) . '" class="' . esc_attr($class) . '">' . esc_html($data_object->title) . '</a>';
    }
}

// Fallback menus for fresh installs (keeps prototype links working before menus are created)
function domain_platform_fallback_menu() {
    $items = [
        [home_url('/domains'), 'Domains'],
        [home_url('/pricing'), 'Pricing'],
        [home_url('/transfer-domain'), 'Transfer'],
        [home_url('/whois'), 'WHOIS'],
        [home_url('/support'), 'Support'],
    ];
    foreach ($items as [$url, $label]) {
        echo '<a href="' . esc_url($url) . '" class="px-3 py-2 rounded-lg hover:bg-system-fill hover:text-label">' . esc_html($label) . '</a>';
    }
}
function domain_platform_fallback_menu_mobile() {
    $items = [
        [home_url('/domains'), 'Domains'],
        [home_url('/pricing'), 'Pricing'],
        [home_url('/transfer-domain'), 'Transfer Domain'],
        [home_url('/whois'), 'WHOIS Lookup'],
        [home_url('/support'), 'Support'],
    ];
    foreach ($items as [$url, $label]) {
        echo '<a href="' . esc_url($url) . '" class="block px-3 py-3 rounded-lg hover:bg-system-fill font-medium">' . esc_html($label) . '</a>';
    }
}

// Admin notice if Tailwind output missing (helps QA after npm run build)
add_action('admin_notices', function () {
    if (!file_exists(get_template_directory() . '/css/output.css') && current_user_can('manage_options')) {
        echo '<div class="notice notice-warning"><p><strong>Domain Platform:</strong> css/output.css not found. Run <code>npm install && npm run build</code> in the theme root to generate the production Tailwind build. Enqueue will fall back to style.css until then.</p></div>';
    }
});
