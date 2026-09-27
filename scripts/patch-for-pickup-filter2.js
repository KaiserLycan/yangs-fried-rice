const fs = require('fs');
let c = fs.readFileSync('app/manage/kds/page.tsx', 'utf8');

c = c.replace(
  /mapped = mapped\.filter\(o => o\.orderInfo\.type === "take_out"\);/g,
  `mapped = mapped.filter(o => o.orderInfo.type === "take_out" || o.orderInfo.type === "pickup");`
);

fs.writeFileSync('app/manage/kds/page.tsx', c);
