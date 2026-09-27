const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Text Sizes
  content = content.replace(/text-\[22px\]/g, 'text-2xl');
  content = content.replace(/text-\[20px\]/g, 'text-xl');
  content = content.replace(/text-\[13px\]/g, 'text-sm');
  content = content.replace(/text-\[12px\]/g, 'text-xs');
  content = content.replace(/text-\[11px\]/g, 'text-xs');
  content = content.replace(/text-\[10px\]/g, 'text-[0.625rem]'); // Wait, maybe just text-xs and a custom class? 
  // Let's just use text-xs for everything below 12px.
  content = content.replace(/text-\[10px\]/g, 'text-xs');

  // Border Radii
  content = content.replace(/rounded-\[14px\]/g, 'rounded-xl');
  content = content.replace(/rounded-\[10px\]/g, 'rounded-md');

  // Colors
  content = content.replace(/bg-\[#2f5e3c\]/g, 'bg-success');
  content = content.replace(/text-\[#2f5e3c\]/g, 'text-success');

  content = content.replace(/bg-\[#b8352a\]/g, 'bg-destructive');
  content = content.replace(/text-\[#b8352a\]/g, 'text-destructive');
  content = content.replace(/border-\[#b8352a\]/g, 'border-destructive');
  content = content.replace(/text-\[#8c1c13\]/g, 'text-destructive');
  content = content.replace(/border-\[#8c1c13\]/g, 'border-destructive');

  content = content.replace(/border-\[#e3d6c3\]/g, 'border-rule');

  content = content.replace(/text-\[#1a1210\]/g, 'text-foreground');
  content = content.replace(/border-\[#1a1210\]/g, 'border-foreground');
  content = content.replace(/bg-\[#1a1210\]/g, 'bg-foreground');

  content = content.replace(/border-\[#c9c1b8\]/g, 'border-input');
  content = content.replace(/bg-\[#c9c1b8\]/g, 'bg-muted');

  content = content.replace(/text-\[#a39a90\]/g, 'text-muted-foreground');
  content = content.replace(/text-\[#7a6a60\]/g, 'text-muted-strong');

  content = content.replace(/bg-\[#faf7f0\]/g, 'bg-card');
  content = content.replace(/bg-\[#f3efe8\]/g, 'bg-background'); // or bg-field?

  // Replace <button> with <Button variant="unstyled"> if not already imported
  if (content.includes('<button') && !content.includes('@/components/ui/button')) {
    content = 'import { Button } from "@/components/ui/button";\n' + content;
  }
  content = content.replace(/<button/g, '<Button variant="unstyled"');
  content = content.replace(/<\/button>/g, '</Button>');

  fs.writeFileSync(file, content, 'utf8');
}

fixFile('components/manage/dashboard/store-control-panel.tsx');
fixFile('components/manage/dashboard/refunds-panel.tsx');
