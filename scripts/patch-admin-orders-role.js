const fs = require('fs');

// 1. Add getEmployeeAccess to lib/actions/orders.ts
let ordersTs = fs.readFileSync('lib/actions/orders.ts', 'utf8');
if (!ordersTs.includes('getEmployeeAccess')) {
  ordersTs = ordersTs.replace(
    `async function requireManageAccess(): Promise<`,
    `export async function getEmployeeAccess(): Promise<ActionResult<{ employee_id: string; role: string; isManager: boolean }>> {
  const auth = await requireManageAccess();
  if (!auth.data) return { data: null, error: auth.error };
  return { data: { employee_id: auth.data.employee_id, role: auth.data.role, isManager: auth.data.role.toLowerCase() === 'manager' }, error: null };
}

async function requireManageAccess(): Promise<`
  );
  fs.writeFileSync('lib/actions/orders.ts', ordersTs);
}

// 2. Patch app/manage/orders/page.tsx to fetch role and pass it to OrderSidebar
let pageTsx = fs.readFileSync('app/manage/orders/page.tsx', 'utf8');

if (!pageTsx.includes('isManager')) {
  pageTsx = pageTsx.replace(
    `import { getDetailedOrders, updateOrderStatus, getPaymentIssuesForAdmin, type PaymentIssueOrder } from "@/lib/actions/orders";`,
    `import { getDetailedOrders, updateOrderStatus, getPaymentIssuesForAdmin, getEmployeeAccess, type PaymentIssueOrder } from "@/lib/actions/orders";`
  );

  pageTsx = pageTsx.replace(
    `const [isProcessing, setIsProcessing] = useState(false);`,
    `const [isProcessing, setIsProcessing] = useState(false);
  const [isManager, setIsManager] = useState(false);
  
  useEffect(() => {
    getEmployeeAccess().then(res => {
      if (res.data) setIsManager(res.data.isManager);
    });
  }, []);`
  );

  pageTsx = pageTsx.replace(
    `<OrderSidebar 
          activeStatus={activeStatus}`,
    `<OrderSidebar 
          isManager={isManager}
          activeStatus={activeStatus}`
  );
  
  fs.writeFileSync('app/manage/orders/page.tsx', pageTsx);
}
