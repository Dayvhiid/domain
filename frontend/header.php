<!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="profile" href="https://gmpg.org/xfn/11">
<?php wp_head(); ?>
</head>
<body <?php body_class('bg-app text-primary antialiased'); ?>>
<?php wp_body_open(); ?>
<a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 bg-system text-label px-4 py-2 rounded z-50"><?php esc_html_e('Skip to content','domain-platform'); ?></a>

<header class="sticky top-0 z-40 bg-system text-label backdrop-blur border-b border-separator">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex h-16 items-center justify-between gap-4">
      <a href="<?php echo esc_url(home_url('/')); ?>" class="flex items-center gap-2 font-bold text-xl tracking-tight">
        <span class="w-8 h-8 rounded-lg bg-accent-500 text-brand-900 grid place-items-center text-sm">◈</span>
        <?php bloginfo('name'); ?>
      </a>

      <nav class="hidden lg:flex items-center gap-1 text-sm font-medium text-secondary-label" aria-label="<?php esc_attr_e('Primary','domain-platform'); ?>">
        <?php
        wp_nav_menu([
          'theme_location' => 'primary',
          'container'      => false,
          'fallback_cb'    => 'domain_platform_fallback_menu',
          'items_wrap'     => '%3$s',
          'walker'         => new Domain_Platform_Walker(),
        ]);
        ?>
      </nav>

      <div class="hidden lg:flex items-center gap-2">
        <a href="<?php echo esc_url(home_url('/cart')); ?>" class="relative p-2 rounded-lg text-secondary-label hover:bg-system-fill hover:text-label" aria-label="<?php esc_attr_e('Cart','domain-platform'); ?>">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6h15l-1.5 9h-13z"/><path d="M6 6L5 2H2"/><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/></svg>
          <span data-cart-count class="hidden absolute -top-1 -right-1 bg-accent-500 text-brand-900 text-xs w-5 h-5 grid place-items-center rounded-full">0</span>
        </a>
        <?php if (is_user_logged_in()): ?>
          <a href="<?php echo esc_url(home_url('/client-dashboard')); ?>" class="px-4 py-2 rounded-lg text-secondary-label hover:bg-system-fill hover:text-label text-sm font-medium"><?php esc_html_e('Dashboard','domain-platform'); ?></a>
          <a href="<?php echo esc_url(wp_logout_url(home_url())); ?>" class="px-4 py-2 rounded-lg border border-separator text-secondary-label hover:text-label text-sm font-medium"><?php esc_html_e('Log out','domain-platform'); ?></a>
        <?php else: ?>
          <a href="<?php echo esc_url(wp_login_url()); ?>" class="px-4 py-2 rounded-lg text-secondary-label hover:bg-system-fill hover:text-label text-sm font-medium"><?php esc_html_e('Log in','domain-platform'); ?></a>
          <a href="<?php echo esc_url(home_url('/register')); ?>" class="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold"><?php esc_html_e('Create account','domain-platform'); ?></a>
        <?php endif; ?>
      </div>

      <button id="mobile-menu-button" class="lg:hidden  p-3 flex items-center justify-center min-h-[44px] min-w-[44px]  rounded-lg border border-separator text-label" aria-expanded="false" aria-controls="mobile-menu" aria-label="<?php esc_attr_e('Open menu','domain-platform'); ?>">
        <svg id="icon-open" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        <svg id="icon-close" class="hidden" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
  </div>

  <div id="mobile-menu" class="hidden lg:hidden border-t border-separator bg-system text-label" hidden>
    <nav class="px-4 py-4 space-y-1" aria-label="<?php esc_attr_e('Mobile','domain-platform'); ?>">
      <?php
      wp_nav_menu([
        'theme_location' => 'primary',
        'container'      => false,
        'fallback_cb'    => 'domain_platform_fallback_menu_mobile',
        'items_wrap'     => '%3$s',
      ]);
      ?>
      <div class="pt-4 border-t mt-3 border-separator flex flex-col gap-2">
        <a href="<?php echo esc_url(home_url('/cart')); ?>" class="px-3 py-3 rounded-lg hover:bg-system-fill font-medium flex justify-between"><?php esc_html_e('Cart','domain-platform'); ?> <span data-cart-count class="hidden bg-accent-500 text-brand-900 text-xs px-2 py-1 rounded-full">0</span></a>
        <?php if (!is_user_logged_in()): ?>
          <a href="<?php echo esc_url(wp_login_url()); ?>" class="text-center px-4 py-3 rounded-lg border border-separator font-medium"><?php esc_html_e('Log in','domain-platform'); ?></a>
          <a href="<?php echo esc_url(home_url('/register')); ?>" class="text-center bg-brand-500 text-white px-4 py-3 rounded-lg font-semibold"><?php esc_html_e('Create account','domain-platform'); ?></a>
        <?php endif; ?>
      </div>
    </nav>
  </div>
</header>
