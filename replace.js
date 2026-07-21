const fs = require('fs');
const path = require('path');

const walk = (dir, done) => {
  let results = [];
  fs.readdir(dir, (err, list) => {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach((file) => {
      file = path.resolve(dir, file);
      fs.stat(file, (err, stat) => {
        if (stat && stat.isDirectory()) {
          walk(file, (err, res) => {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

walk('src', (err, results) => {
  if (err) throw err;
  
  const tsxFiles = results.filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
  
  tsxFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    // Simple heuristic: if we replace something, we need the import.
    let needsImport = false;
    
    // Replace standalone "CyberX" in JSX text: >CyberX<
    if (content.match(/>([^<]*)CyberX([^<]*)</g)) {
      content = content.replace(/>([^<]*)CyberX([^<]*)</g, (match, p1, p2) => {
        return `>${p1}{AppConfig.name}${p2}<`;
      });
      needsImport = true;
    }
    
    // Replace "CyberX" inside template literals
    if (content.includes('`') && content.match(/`([^`]*?)CyberX([^`]*?)`/g)) {
      content = content.replace(/`([^`]*?)CyberX([^`]*?)`/g, (match, p1, p2) => {
        return `\`${p1}\${AppConfig.name}${p2}\``;
      });
      needsImport = true;
    }

    // Replace "CyberX" inside regular strings (single or double quotes)
    // This is tricky. Let's just turn them into template literals if they have CyberX
    if (content.match(/'([^']*?)CyberX([^']*?)'/g)) {
      content = content.replace(/'([^']*?)CyberX([^']*?)'/g, (match, p1, p2) => {
        return `\`${p1}\${AppConfig.name}${p2}\``;
      });
      needsImport = true;
    }
    
    if (content.match(/"([^"]*?)CyberX([^"]*?)"/g)) {
      content = content.replace(/"([^"]*?)CyberX([^"]*?)"/g, (match, p1, p2) => {
        return `\`${p1}\${AppConfig.name}${p2}\``;
      });
      needsImport = true;
    }

    // Replace logo URL
    if (content.includes('/cyberx-logo.webp')) {
      content = content.replace(/'\/cyberx-logo\.webp'/g, 'AppConfig.logoUrl');
      content = content.replace(/"\/cyberx-logo\.webp"/g, 'AppConfig.logoUrl');
      // If it was in JSX prop like src="/cyberx-logo.webp"
      content = content.replace(/src="\/cyberx-logo\.webp"/g, 'src={AppConfig.logoUrl}');
      needsImport = true;
    }

    // Replace email
    if (content.includes('tanmay@cyberx.org.in')) {
      content = content.replace(/tanmay@cyberx\.org\.in/g, '${AppConfig.contactEmail}');
      needsImport = true;
    }

    // Fix up some common issues where we might have generated `${AppConfig.name}` inside a normal JSX text without braces, 
    // but our first regex handled >...< by using {AppConfig.name}
    
    if (needsImport && content !== originalContent) {
      if (!content.includes("import { AppConfig }")) {
        // Add import at the top (after other imports or at very top)
        const lines = content.split('\n');
        let lastImportIndex = -1;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim().startsWith('import ')) {
            lastImportIndex = i;
          }
        }
        
        if (lastImportIndex !== -1) {
          lines.splice(lastImportIndex + 1, 0, `import { AppConfig } from '@/lib/config';`);
        } else {
          lines.unshift(`import { AppConfig } from '@/lib/config';`);
        }
        content = lines.join('\n');
      }
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Updated ${file}`);
    }
  });
});
