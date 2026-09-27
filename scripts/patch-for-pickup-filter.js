const fs = require('fs');
let c = fs.readFileSync('app/manage/kds/page.tsx', 'utf8');

c = c.replace(
  `          // For Pick-up only shows take_out
          if (activeTab === "for_pickup") {
            mapped = mapped.filter(o => o.orderInfo.type === "take_out");
          }`,
  `          // For Pick-up only shows take_out or pickup
          if (activeTab === "for_pickup") {
            mapped = mapped.filter(o => o.orderInfo.type === "take_out" || o.orderInfo.type === "pickup");
          }`
);

fs.writeFileSync('app/manage/kds/page.tsx', c);
