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
  if (file.endsWith('index.html')) return; // Already updated index.html manually
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Add Outfit font to Google Fonts link
  content = content.replace(
    /family=Inter:wght@400;500;600;700&family=JetBrains\+Mono:wght@400;500&display=swap/g,
    'family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Outfit:wght@500;600;700;800&display=swap'
  );

  // Apply font-outfit to h1, h2, h3 and title classes
  content = content.replace(/class="([^"]*)text-large-title([^"]*)"/g, 'class="$1text-large-title font-outfit$2"');
  content = content.replace(/class="([^"]*)text-title-1([^"]*)"/g, 'class="$1text-title-1 font-outfit$2"');
  content = content.replace(/class="([^"]*)text-title-2([^"]*)"/g, 'class="$1text-title-2 font-outfit$2"');
  content = content.replace(/class="([^"]*)text-title-3([^"]*)"/g, 'class="$1text-title-3 font-outfit$2"');
  content = content.replace(/class="([^"]*)text-2xl([^"]*)"/g, 'class="$1text-title-2 font-outfit$2"');
  content = content.replace(/<h1 class="([^"]*)"/g, '<h1 class="$1 font-outfit"');
  
  // Clean up duplicate font-outfit
  content = content.replace(/font-outfit font-outfit/g, 'font-outfit');

  // Replace old hover shadow with hover-lift
  content = content.replace(/hover:shadow-level-2 transition-shadow duration-normal/g, 'hover-lift');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
