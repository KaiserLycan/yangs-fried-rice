const fs = require('fs');
let c = fs.readFileSync('app/manage/kds/page.tsx', 'utf8');

c = c.replace(
  /import \{ updateOrderStatus, getDetailedOrders \} from "@\/lib\/actions\/orders";/,
  `import { updateOrderStatus, getDetailedOrders } from "@/lib/actions/orders";\nimport { useKdsSound } from "@/hooks/use-kds-sound";`
);

c = c.replace(
  /const \[orders, setOrders\] = useState<OrderData\[\]>\(\[\]\);/,
  `const [orders, setOrders] = useState<OrderData[]>([]);\n  useKdsSound(orders);`
);

fs.writeFileSync('app/manage/kds/page.tsx', c);
