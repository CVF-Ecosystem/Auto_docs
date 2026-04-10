const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'app', '(dashboard)');
const destDir = path.join(__dirname, 'src', 'app', 'dashboard');

try {
  fs.renameSync(srcDir, destDir);
  console.log('Renamed (dashboard) to dashboard');
} catch (e) {
  console.error('Rename failed:', e.message);
  // Try fallback to copy then delete
  try {
    fs.cpSync(srcDir, destDir, { recursive: true });
    console.log('Copied to dashboard');
    fs.rmSync(srcDir, { recursive: true, force: true });
    console.log('Removed old (dashboard)');
  } catch (err) {
    console.error('Fallback failed:', err.message);
  }
}
