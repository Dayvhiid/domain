<footer class="bg-secondary-system-background text-label border-t border-separator">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
      <div>
        <div class="font-bold flex items-center gap-2"><span class="w-8 h-8 rounded-lg bg-accent-500 text-brand-900 grid place-items-center text-sm" aria-hidden="true">◈</span> <?php bloginfo('name'); ?></div>
        <p class="text-secondary-label mt-3"><?php echo esc_html(get_bloginfo('description') ?: 'White-label domain reseller — transparent pricing, fast search, secure management.'); ?></p>
        <?php if (is_active_sidebar('footer-1')) dynamic_sidebar('footer-1'); ?>
      </div>
      <div>
        <h4 class="font-semibold text-label"><?php esc_html_e('Domains','domain-platform'); ?></h4>
        <?php wp_nav_menu(['theme_location'=>'footer-domains','container'=>false,'fallback_cb'=>function(){ echo '<ul class="mt-3 space-y-2 text-secondary-label"><li><a href="'.esc_url(home_url('/domains')).'" class="hover:text-label transition-colors p-1 -m-1 block min-h-[44px]">Browse domains</a></li><li><a href="'.esc_url(home_url('/pricing')).'" class="hover:text-label transition-colors p-1 -m-1 block min-h-[44px]">Pricing</a></li><li><a href="'.esc_url(home_url('/transfer-domain')).'" class="hover:text-label transition-colors p-1 -m-1 block min-h-[44px]">Transfer</a></li><li><a href="'.esc_url(home_url('/whois')).'" class="hover:text-label transition-colors p-1 -m-1 block min-h-[44px]">WHOIS</a></li></ul>'; },'items_wrap'=>'%3$s']); ?>
      </div>
      <div>
        <h4 class="font-semibold text-label"><?php esc_html_e('Support','domain-platform'); ?></h4>
        <?php wp_nav_menu(['theme_location'=>'footer-support','container'=>false,'fallback_cb'=>function(){ echo '<ul class="mt-3 space-y-2 text-secondary-label"><li><a href="'.esc_url(home_url('/support')).'" class="hover:text-label transition-colors p-1 -m-1 block min-h-[44px]">Help center</a></li><li><a href="'.esc_url(home_url('/faq')).'" class="hover:text-label transition-colors p-1 -m-1 block min-h-[44px]">FAQ</a></li><li><a href="'.esc_url(home_url('/contact')).'" class="hover:text-label transition-colors p-1 -m-1 block min-h-[44px]">Contact</a></li><li><a href="'.esc_url(home_url('/client-dashboard')).'" class="hover:text-label transition-colors p-1 -m-1 block min-h-[44px]">Client area</a></li></ul>'; },'items_wrap'=>'%3$s']); ?>
      </div>
      <div>
        <h4 class="font-semibold text-label"><?php esc_html_e('Company & Legal','domain-platform'); ?></h4>
        <?php wp_nav_menu(['theme_location'=>'footer-legal','container'=>false,'fallback_cb'=>function(){ echo '<ul class="mt-3 space-y-2 text-secondary-label"><li><a href="'.esc_url(home_url('/about')).'" class="hover:text-label transition-colors p-1 -m-1 block min-h-[44px]">About</a></li><li><a href="'.esc_url(home_url('/terms')).'" class="hover:text-label transition-colors p-1 -m-1 block min-h-[44px]">Terms</a></li><li><a href="'.esc_url(home_url('/privacy')).'" class="hover:text-label transition-colors p-1 -m-1 block min-h-[44px]">Privacy</a></li><li><a href="'.esc_url(home_url('/refund-policy')).'" class="hover:text-label transition-colors p-1 -m-1 block min-h-[44px]">Refund policy</a></li></ul>'; },'items_wrap'=>'%3$s']); ?>
      </div>
    </div>
    <div class="mt-10 pt-6 border-t border-separator flex flex-col sm:flex-row justify-between gap-3 text-xs text-secondary-label">
      <span>&copy; <?php echo esc_html(date('Y')); ?> <?php bloginfo('name'); ?>. <?php esc_html_e('All rights reserved.','domain-platform'); ?></span>
      <span><?php esc_html_e('Brand colors configurable via CSS variables.','domain-platform'); ?></span>
    </div>
  </div>
</footer>

<div id="toast-container" class="fixed bottom-4 right-4 z-50 space-y-2 w-80 pointer-events-none" aria-live="polite"></div>

<?php wp_footer(); ?>
</body>
</html>
