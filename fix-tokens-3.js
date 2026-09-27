const fs = require('fs');

let file1 = 'components/manage/dashboard/refunds-panel.tsx';
let content1 = fs.readFileSync(file1, 'utf8');
content1 = content1.replace(/text-xl/g, 'text-2xl');
fs.writeFileSync(file1, content1, 'utf8');

let file2 = 'components/manage/dashboard/store-control-panel.tsx';
let content2 = fs.readFileSync(file2, 'utf8');
content2 = content2.replace(/text-xl/g, 'text-2xl');
fs.writeFileSync(file2, content2, 'utf8');
