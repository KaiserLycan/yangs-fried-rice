const fs = require('fs');

let content = fs.readFileSync('current_orders_page.tsx', 'utf8');

// Add imports
content = content.replace(
  'import { getDetailedOrders, updateOrderStatus } from "@/lib/actions/orders";',
  'import { getDetailedOrders, updateOrderStatus } from "@/lib/actions/orders";\nimport { getCurrentEmployee } from "@/lib/actions/admin";\nimport { isManager } from "@/lib/auth/roles";\nimport { DateInput } from "@/components/manage/reports/report-controls";'
);

// Add states
const stateInjection = `
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isManagerRole, setIsManagerRole] = useState(false);
  
  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
`;
content = content.replace(
  /const \[orders, setOrders\] = useState<OrderData\[\]>\(\[\]\);\n\s*const \[isLoading, setIsLoading\] = useState\(true\);\n\s*const \[isProcessing, setIsProcessing\] = useState\(false\);/m,
  stateInjection.trim()
);

// Add role fetch
const effectInjection = `
  useEffect(() => {
    getCurrentEmployee().then(res => {
      if (res.data) setIsManagerRole(isManager(res.data.role));
    });
  }, []);
`;
content = content.replace(
  /useEffect\(\(\) => \{\n\s*fetchOrders\(\);\n\s*\}, \[fetchOrders\]\);/m,
  `useEffect(() => {\n    fetchOrders();\n  }, [fetchOrders]);\n${effectInjection}`
);

// Update fetchOrders
content = content.replace(
  /else if \(uiTab === "delivering" \|\| uiTab === "delivery"\) dbStatus = \["ready", "out_for_delivery"\];/m,
  `else if (uiTab === "delivering" || uiTab === "delivery") dbStatus = ["ready", "out_for_delivery"];\n      else if (uiTab === "payment issues") dbStatus = ["awaiting_payment", "payment_failed"];`
);

content = content.replace(
  /const summaryResult = await getDetailedOrders\(\{/,
  `const summaryResult = await getDetailedOrders({\n        date_from: dateFrom ? new Date(dateFrom).toISOString() : undefined,\n        date_to: dateTo ? new Date(new Date(dateTo).setHours(23, 59, 59, 999)).toISOString() : undefined,\n        customer_name: customerName,\n        customer_phone: customerPhone,\n        payment_method: paymentMethod,\n        include_unpaid: uiTab === "payment issues",`
);

content = content.replace(
  /\[activeStatus, currentPage, pageSize, search, showToast\]\);/,
  `[activeStatus, currentPage, pageSize, search, showToast, dateFrom, dateTo, customerName, customerPhone, paymentMethod]);`
);

// Add filter UI
const filterUI = `
      <div className="flex flex-col md:flex-row gap-4 md:gap-8 flex-1 min-h-0">
        <div className="flex flex-col gap-4">
          <OrderSidebar 
            activeStatus={activeStatus} 
            isManager={isManagerRole}
            onStatusChange={(status) => {
              setActiveStatus(status);
              setCurrentPage(1); // Reset page on filter change
            }} 
          />
          <div className="flex flex-col gap-3 p-4 bg-white rounded-xl border border-[#DDCDB8]">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Filters</h3>
            <DateInput label="From" max="" value={dateFrom} onChange={(v) => { setDateFrom(v); setCurrentPage(1); }} />
            <DateInput label="To" max="" value={dateTo} onChange={(v) => { setDateTo(v); setCurrentPage(1); }} />
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-[1.32px] text-[#7a6a60]">Customer Name</label>
              <input type="text" value={customerName} onChange={e => { setCustomerName(e.target.value); setCurrentPage(1); }} className="h-10 rounded-[12px] border border-[#ddcdb8] px-3 text-[13px]" placeholder="Name" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-[1.32px] text-[#7a6a60]">Phone</label>
              <input type="text" value={customerPhone} onChange={e => { setCustomerPhone(e.target.value); setCurrentPage(1); }} className="h-10 rounded-[12px] border border-[#ddcdb8] px-3 text-[13px]" placeholder="Phone" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-[1.32px] text-[#7a6a60]">Payment</label>
              <select value={paymentMethod} onChange={e => { setPaymentMethod(e.target.value); setCurrentPage(1); }} className="h-10 rounded-[12px] border border-[#ddcdb8] px-3 text-[13px] bg-white">
                <option value="">All</option>
                <option value="pay_in_store">Pay in Store</option>
                <option value="paymongo">PayMongo</option>
              </select>
            </div>
            <button onClick={() => { setDateFrom(""); setDateTo(""); setCustomerName(""); setCustomerPhone(""); setPaymentMethod(""); setCurrentPage(1); }} className="mt-2 text-xs font-semibold text-[#b8352a] hover:underline">Clear Filters</button>
          </div>
        </div>
`;
content = content.replace(
  /<OrderSidebar \n\s*activeStatus=\{activeStatus\} \n\s*onStatusChange=\{\(status\) => \{\n\s*setActiveStatus\(status\);\n\s*setCurrentPage\(1\); \/\/ Reset page on filter change\n\s*\}\} \n\s*\/>/m,
  ''
);
content = content.replace(
  /<div className="flex flex-col md:flex-row gap-4 md:gap-8 flex-1 min-h-0">/m,
  filterUI.trim()
);

fs.writeFileSync('app/manage/orders/page.tsx', content);

