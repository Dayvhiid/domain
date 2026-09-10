<?php
/**
 * index.php – fallback blog index (required by WordPress)
 * Theme covers custom post types later; this satisfies core requirement: get_header() top, get_footer() bottom, Loop.
 */
get_header(); ?>

<main id="main" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <header class="max-w-3xl mb-8">
    <h1 class="text-3xl font-bold tracking-tight font-outfit"><?php
      if (is_home() && !is_front_page()) echo esc_html(get_the_title(get_option('page_for_posts')));
      elseif (is_search()) printf(esc_html__('Search results for: %s', 'domain-platform'), '<span class="text-brand-500">' . get_search_query() . '</span>');
      elseif (is_archive()) echo esc_html(get_the_archive_title());
      else esc_html_e('Latest posts', 'domain-platform');
    ?></h1>
    <?php if (is_archive()) the_archive_description('<p class="text-slate-600 mt-2">','</p>'); ?>
  </header>

  <?php if (have_posts()) : ?>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <?php while (have_posts()) : the_post(); ?>
        <article <?php post_class('card p-6'); ?>>
          <?php if (has_post_thumbnail()) the_post_thumbnail('medium', ['class'=>'rounded-lg w-full mb-4']); ?>
          <h2 class="text-lg font-semibold"><a href="<?php the_permalink(); ?>" class="hover:text-brand-500"><?php the_title(); ?></a></h2>
          <div class="text-xs text-slate-500 mt-1"><?php echo esc_html(get_the_date()); ?> · <?php the_author(); ?></div>
          <div class="text-sm text-slate-600 mt-3"><?php the_excerpt(); ?></div>
          <a href="<?php the_permalink(); ?>" class="inline-flex mt-4 text-sm font-medium text-brand-500 hover:underline"><?php esc_html_e('Read more →','domain-platform'); ?></a>
        </article>
      <?php endwhile; ?>
    </div>
    <div class="mt-8 flex justify-between">
      <?php previous_posts_link(__('← Newer','domain-platform')); ?>
      <?php next_posts_link(__('Older →','domain-platform')); ?>
    </div>
  <?php else : ?>
    <div class="card p-10 text-center">
      <p class="font-medium"><?php esc_html_e('Nothing found.','domain-platform'); ?></p>
      <p class="text-sm text-slate-600 mt-1"><?php esc_html_e('Try the domain search or create your first post.','domain-platform'); ?></p>
      <a href="<?php echo esc_url(home_url('/')); ?>" class="inline-block mt-4 bg-brand-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold"><?php esc_html_e('Go to homepage','domain-platform'); ?></a>
    </div>
  <?php endif; ?>
</main>

<?php get_footer(); ?>
