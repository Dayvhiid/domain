<?php
/**
 * front-page.php – homepage (mirrors index.html hero + sections)
 * Uses get_header()/get_footer() so wp_head/wp_footer are correct.
 * Content is editable via Gutenberg later; static markup kept as fallback.
 */
get_header();
?>

<main id="main">
  <section class="bg-gradient-to-b from-[var(--bg-surface)] to-[var(--bg-app)] border-b border-slate-100">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      <div class="max-w-3xl mx-auto text-center">
        <h1 class="text-4xl sm:text-5xl font-bold tracking-tight leading-tight font-outfit"><?php echo wp_kses_post(get_theme_mod('hero_title', 'Find your perfect domain<br><span class="text-brand-500">in seconds</span>')); ?></h1>
        <p class="mt-4 text-lg text-slate-600"><?php echo esc_html(get_theme_mod('hero_subtitle', 'Transparent pricing. No hidden fees. Register, transfer and manage domains with confidence.')); ?></p>
        <form data-domain-search-form data-target="<?php echo esc_url(home_url('/search-results')); ?>" class="mt-8 bg-white card p-2 flex flex-col sm:flex-row gap-2 shadow-sm">
          <label for="hero-search" class="sr-only"><?php esc_html_e('Domain name','domain-platform'); ?></label>
          <input id="hero-search" type="search" placeholder="<?php esc_attr_e('Enter your domain — e.g. mybusiness','domain-platform'); ?>" class="flex-1 px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 text-base" required>
          <button type="submit" class="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-lg font-semibold whitespace-nowrap"><?php esc_html_e('Search domains','domain-platform'); ?></button>
        </form>
        <div class="mt-4 flex flex-wrap justify-center gap-2 text-sm">
          <span class="text-slate-500"><?php esc_html_e('Popular:','domain-platform'); ?></span>
          <?php foreach (['.com','.ng','.co.za','.africa'] as $tld): ?>
            <a href="<?php echo esc_url(add_query_arg('domain','example'.$tld, home_url('/search-results'))); ?>" class="px-3 py-1 rounded-full border bg-white hover:bg-slate-50"><?php echo esc_html($tld); ?></a>
          <?php endforeach; ?>
        </div>
      </div>
    </div>
  </section>

  <?php
  // Keep original static sections accessible via template parts later
  // For now include a CTA to the blog or WordPress content if front page is set to posts
  if (have_posts()) {
      echo '<section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><h2 class="text-xl font-bold">'.esc_html__('Latest updates','domain-platform').'</h2><div class="grid md:grid-cols-3 gap-4 mt-4">';
      while (have_posts()) { the_post(); echo '<article class="card p-4"><h3 class="font-semibold"><a href="'.esc_url(get_permalink()).'" class="hover:underline">'.esc_html(get_the_title()).'</a></h3><p class="text-sm text-slate-600 mt-1">'.esc_html(get_the_excerpt()).'</p></article>'; }
      echo '</div></section>';
  }
  ?>
</main>

<?php get_footer(); ?>
