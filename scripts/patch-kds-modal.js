const fs = require('fs');
let c = fs.readFileSync('app/manage/kds/page.tsx', 'utf8');

c = c.replace(
  /import \{ KdsOrderCard \} from "@\/components\/manage\/kds\/kds-order-card";/,
  'import { KdsOrderCard } from "@/components/manage/kds/kds-order-card";\nimport { CancelReasonModal } from "@/components/manage/orders/cancel-reason-modal";'
);

c = c.replace(
  /const \[viewMode, setViewMode\] = useState<"Grid" | "List"\>\("Grid"\);/,
  'const [viewMode, setViewMode] = useState<"Grid" | "List">("Grid");\n  const [cancelOrder, setCancelOrder] = useState<OrderData | null>(null);\n  const [isProcessing, setIsProcessing] = useState(false);'
);

const handleActionReplacement = `
  const handleAction = async (type: StaffAction, order: OrderData) => {
    if (type === "Cancel") {
      setCancelOrder(order);
      return;
    }

    setIsProcessing(true);
    const newDbStatus = dbStatusFor(type);
    const result = await updateOrderStatus(order.id, newDbStatus);

    if (result.error) {
      showToast(\`Failed: \${result.error}\`, "error");
    } else {
      showToast(actionCopy(type, order.orderNumber).done, "success");
      await fetchOrders();
    }
    setIsProcessing(false);
  };

  const handleCancelConfirm = async (reason: string) => {
    if (!cancelOrder) return;
    setIsProcessing(true);
    
    const result = await updateOrderStatus(
      cancelOrder.id,
      "cancelled",
      reason
    );

    if (result.error) {
      showToast(\`Failed: \${result.error}\`, "error");
    } else {
      showToast(actionCopy("Cancel", cancelOrder.orderNumber).done, "success");
      await fetchOrders();
      setCancelOrder(null);
    }
    setIsProcessing(false);
  };
`;

c = c.replace(
  /const handleAction = async \([\s\S]*?fetchOrders\(\);\s*\n\s*\}\s*\n\s*\};/,
  handleActionReplacement
);

const footerRegex = /(<\/div>\s*<\/div>\s*\)\;\s*})/;
const modalInjection = `      <CancelReasonModal 
        isOpen={cancelOrder !== null}
        order={cancelOrder}
        isProcessing={isProcessing}
        onClose={() => setCancelOrder(null)}
        onConfirm={handleCancelConfirm}
      />\n$1`;

c = c.replace(footerRegex, modalInjection);

fs.writeFileSync('app/manage/kds/page.tsx', c);
console.log('kds patched');
