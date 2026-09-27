const fs = require('fs');
let c = fs.readFileSync('components/manage/orders/order-filter-popover.tsx', 'utf8');

c = c.replace(/variant="ghost"/g, 'variant="outline"');

fs.writeFileSync('components/manage/orders/order-filter-popover.tsx', c);
