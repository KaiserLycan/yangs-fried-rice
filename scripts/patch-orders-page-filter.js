const fs = require('fs');
let c = fs.readFileSync('app/manage/orders/page.tsx', 'utf8');

c = c.replace(
  /import \{ OrderSidebar, OrderStatus \} from "@\/components\/manage\/orders\/order-sidebar";/,
  `import { OrderSidebar, OrderStatus } from "@/components/manage/orders/order-sidebar";\nimport { OrderFilterPopover, type OrderFilterState } from "@/components/manage/orders/order-filter-popover";`
);

// Add filter state
c = c.replace(
  /const \[search, setSearch\] = useState\(""\);/,
  `const [search, setSearch] = useState("");\n  const [advancedFilters, setAdvancedFilters] = useState<OrderFilterState>({});`
);

// Add dependencies
c = c.replace(
  /}, \[activeStatus, currentPage, pageSize, search, showToast\]\);/,
  `}, [activeStatus, currentPage, pageSize, search, showToast, advancedFilters]);`
);

// Update fetch call
c = c.replace(
  /search: search \|\| undefined,/,
  `search: search || undefined,\n        customer_name: advancedFilters.customer_name,\n        customer_phone: advancedFilters.customer_phone,\n        customer_id: advancedFilters.customer_id,\n        payment_method: advancedFilters.payment_method,`
);

// Add the Filter button to UI
c = c.replace(
  /<div className="relative w-full sm:w-auto">/,
  `<OrderFilterPopover filters={advancedFilters} onFilterChange={(f) => { setAdvancedFilters(f); setCurrentPage(1); }} />\n            <div className="relative w-full sm:w-auto">`
);

fs.writeFileSync('app/manage/orders/page.tsx', c);
