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

  // Replace bg-nav combinations
  content = content.replace(/bg-nav text-nav/g, 'bg-system text-label');
  content = content.replace(/hover:bg-nav-hover/g, 'hover:bg-system-fill');
  
  // Footer
  content = content.replace(/<footer class="bg-system text-label/g, '<footer class="bg-secondary-system-background text-label');
  content = content.replace(/<footer class="bg-nav/g, '<footer class="bg-secondary-system-background');
  content = content.replace(/border-nav/g, 'border-separator');
  
  // Mobile menu button touch target
  content = content.replace(/id="mobile-menu-button" class="([^"]*)p-2([^"]*)"/g, 'id="mobile-menu-button" class="$1 p-3 flex items-center justify-center min-h-[44px] min-w-[44px] $2"');

  // Any remaining text-nav
  content = content.replace(/text-nav-muted/g, 'text-secondary-label');
  content = content.replace(/text-nav/g, 'text-label');

  // Trust section
  content = content.replace(/<section class="bg-system text-label">/g, '<section class="bg-secondary-system-background text-label border-y border-separator">');

  // CTA
  content = content.replace(/<section class="bg-brand-500 text-label">/g, '<section class="bg-brand-500 text-white">');
  content = content.replace(/<p class="text-label mt-1">Search again/g, '<p class="text-white/80 mt-1">Search again');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
