const fs = require('fs');
function fix(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/rounded-xl/g, 'rounded-lg');
  fs.writeFileSync(file, content, 'utf8');
}
fix('components/manage/dashboard/store-control-panel.tsx');
fix('components/manage/dashboard/refunds-panel.tsx');
