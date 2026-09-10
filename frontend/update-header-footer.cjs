const fs = require('fs');
const path = require('path');

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file.startsWith('.')) continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, fileList);
    } else if (file.endsWith('.html') || file.endsWith('.php')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const files = getFiles(__dirname);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Header changes
  content = content.replace(/bg-nav text-nav px-4 py-2 rounded-lg/g, 'bg-system text-label px-4 py-2 rounded-lg');
  content = content.replace(/material-thick border-b border-nav\/50/g, 'material-thick border-b border-separator');
  content = content.replace(/p-2 rounded-lg border border-opaque-separator text-label" aria-expanded="false" aria-controls="mobile-menu"/g, 'p-3 rounded-lg border border-opaque-separator text-label flex items-center justify-center min-h-[44px] min-w-[44px]" aria-expanded="false" aria-controls="mobile-menu"');
  content = content.replace(/<div id="mobile-menu" class="hidden lg:hidden border-t border-opaque-separator bg-nav text-nav">/g, '<div id="mobile-menu" class="hidden lg:hidden border-t border-opaque-separator bg-system text-label">');
  content = content.replace(/hover:bg-nav-hover/g, 'hover:bg-system-fill');

  // Trust section (bg-nav text-nav -> bg-secondary-system-background text-label)
  content = content.replace(/<section class="bg-nav text-nav">/g, '<section class="bg-secondary-system-background text-label border-y border-separator">');
  content = content.replace(/text-nav-muted mt-1/g, 'text-secondary-label mt-1');
  content = content.replace(/<p class="text-xs text-nav-muted text-center mt-6">/g, '<p class="text-xs text-tertiary-label text-center mt-6">');

  // Final CTA
  content = content.replace(/<section class="bg-brand-500 text-nav">/g, '<section class="bg-brand-500 text-white">');
  content = content.replace(/<p class="text-nav mt-1">/g, '<p class="text-white/80 mt-1">');
  content = content.replace(/bg-\[#fff\] text-\[#172033\]/g, 'bg-system text-label');
  content = content.replace(/bg-nav hover:bg-black text-nav px-6 py-3 rounded-lg font-semibold/g, 'bg-system-background text-label hover:bg-secondary-system-background px-6 py-3 rounded-lg font-semibold min-h-[44px]');

  // Footer
  content = content.replace(/<footer class="bg-nav text-nav">/g, '<footer class="bg-secondary-system-background text-label border-t border-separator">');
  content = content.replace(/<p class="text-nav-muted mt-3">/g, '<p class="text-secondary-label mt-3">');
  content = content.replace(/<h4 class="font-semibold text-nav">/g, '<h4 class="font-semibold text-label">');
  content = content.replace(/<ul class="mt-3 space-y-2 text-nav-muted">/g, '<ul class="mt-3 space-y-2 text-secondary-label">');
  
  // Footer links hover and min height
  content = content.replace(/class="hover:text-nav"/g, 'class="hover:text-label transition-colors p-1 -m-1 block min-h-[44px]"');
  content = content.replace(/border-t border-nav flex/g, 'border-t border-separator flex');
  content = content.replace(/text-caption-2 text-nav-muted/g, 'text-caption-2 text-tertiary-label');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
