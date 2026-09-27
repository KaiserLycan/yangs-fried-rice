const fs = require('fs');

let file1 = 'components/manage/dashboard/refunds-panel.tsx';
let content1 = fs.readFileSync(file1, 'utf8');
content1 = content1.replace(/divide-\[#e3d6c3\]/g, 'divide-rule');
content1 = content1.replace(/border-\[#2f5e3c\]/g, 'border-success');
content1 = content1.replace(/bg-\[#8c1c13\]/g, 'bg-destructive');
content1 = content1.replace(/bg-\[#e5efe7\]/g, 'bg-success/20');
fs.writeFileSync(file1, content1, 'utf8');

let file2 = 'components/manage/dashboard/store-control-panel.tsx';
let content2 = fs.readFileSync(file2, 'utf8');
content2 = content2.replace(/text-\[0.625rem\]/g, 'text-xs');
fs.writeFileSync(file2, content2, 'utf8');
