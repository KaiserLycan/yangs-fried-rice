const fs = require('fs');
let c = fs.readFileSync('app/manage/orders/page.tsx', 'utf8');

c = c.replace(
  `import { getDetailedOrders, updateOrderStatus } from "@/lib/actions/orders";`,
  `import { getDetailedOrders, updateOrderStatus, getPaymentIssuesForAdmin, type PaymentIssueOrder } from "@/lib/actions/orders";`
);

c = c.replace(
  `  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    
    // 1. Bulletproof Status Mapping (Fixed backend mismatch & casing issues)
    let dbStatus: string | string[] | undefined = undefined;
    const uiTab = activeStatus.toLowerCase();
    
    if (uiTab === "queue") dbStatus = "pending";
    else if (uiTab === "preparation" || uiTab === "prep") dbStatus = "preparing";
    else if (uiTab === "delivering" || uiTab === "delivery") dbStatus = ["ready", "out_for_delivery"];
    else if (uiTab === "completed") dbStatus = "completed";
    else if (uiTab === "canceled" || uiTab === "cancelled") dbStatus = "cancelled";

    // 1. Fetch the summaries using server-side pagination & filtering
    const summaryResult = await getDetailedOrders({
      status: dbStatus as any,
      search: search || undefined,
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
    });`,
  `  const [paymentIssues, setPaymentIssues] = useState<PaymentIssueOrder[]>([]);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    
    // 1. Bulletproof Status Mapping (Fixed backend mismatch & casing issues)
    let dbStatus: string | string[] | undefined = undefined;
    const uiTab = activeStatus.toLowerCase();
    
    if (uiTab === "queue") dbStatus = "pending";
    else if (uiTab === "preparation" || uiTab === "prep") dbStatus = "preparing";
    else if (uiTab === "delivering" || uiTab === "delivery") dbStatus = ["ready", "out_for_delivery"];
    else if (uiTab === "completed") dbStatus = "completed";
    else if (uiTab === "canceled" || uiTab === "cancelled") dbStatus = "cancelled";

    if (uiTab === "payment issues") {
      const issueResult = await getPaymentIssuesForAdmin();
      if (issueResult.error) {
        showToast(\`Failed to load issues: \${issueResult.error}\`, "error");
      } else {
        setPaymentIssues(issueResult.data || []);
        // Map the extracted orders for display in the standard grid
        const mappedOrders = (issueResult.data || []).map(i => mapStaffOrder(i.order as any));
        setOrders(mappedOrders);
        setTotalPages(1);
      }
      setIsLoading(false);
      return;
    }

    // 1. Fetch the summaries using server-side pagination & filtering
    const summaryResult = await getDetailedOrders({
      status: dbStatus as any,
      search: search || undefined,
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
    });`
);

fs.writeFileSync('app/manage/orders/page.tsx', c);
