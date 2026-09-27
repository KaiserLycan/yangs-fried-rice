const fs = require('fs');
let c = fs.readFileSync('app/manage/orders/page.tsx', 'utf8');

c = c.replace(
  /import \{ OrderDetailModal \} from "@\/components\/manage\/orders\/order-detail-modal";/,
  'import { OrderDetailModal } from "@/components/manage/orders/order-detail-modal";\nimport { CancelReasonModal } from "@/components/manage/orders/cancel-reason-modal";'
);

c = c.replace(
  /\{confirmAction\?\.type === "Cancel" && \([\s\S]*?\)\}/,
  ''
);

c = c.replace(
  /variant=\{confirmAction\?\.type === "Cancel" \? "confirm" : "primary"\}/,
  'variant="primary"'
);

c = c.replace(
  /\{isProcessing \? "Processing\.\.\." : confirmAction \? actionCopy\(confirmAction\.type, confirmAction\.order\.orderNumber\)\.confirm : "Confirm"\}/,
  '{isProcessing ? "Processing..." : confirmAction ? actionCopy(confirmAction.type, confirmAction.order.orderNumber).confirm : "Confirm"}'
);

c = c.replace(
  /<Dialog\s+open=\{confirmAction !== null\}\s+onClose=\{\(\) => \{\s+setConfirmAction\(null\);\s+setCancelReason\(""\);\s+setShowCancelError\(false\);\s+\}\}/,
  '<Dialog \n        open={confirmAction !== null && confirmAction.type !== "Cancel"}\n        onClose={() => {\n          setConfirmAction(null);\n        }}'
);

c = c.replace(
  /setConfirmAction\(null\);\s+setCancelReason\(""\);\s+setShowCancelError\(false\);/,
  'setConfirmAction(null);'
);

// In handleConfirmAction, we can remove the old cancel validation because Cancel is handled separately now.
// Actually, let's keep handleConfirmAction for non-cancel, and create a new handleCancelConfirm.
const handleConfirmActionReplacement = `
  const handleConfirmAction = async () => {
    if (!confirmAction || confirmAction.type === "Cancel") return;
    
    setIsProcessing(true);

    const newDbStatus = dbStatusFor(confirmAction.type);

    const result = await updateOrderStatus(
      confirmAction.order.id,
      newDbStatus,
      undefined,
    );

    if (result.error) {
      showToast(\`Failed to update order: \${result.error}\`, "error");
    } else {
      showToast(actionCopy(confirmAction.type, confirmAction.order.orderNumber).done, "success");
      await fetchOrders(); // Refresh the active list
      setConfirmAction(null);
      setSelectedOrder(null);
    }
    
    setIsProcessing(false);
  };

  const handleCancelConfirm = async (reason: string) => {
    if (!confirmAction || confirmAction.type !== "Cancel") return;
    
    setIsProcessing(true);
    const result = await updateOrderStatus(
      confirmAction.order.id,
      "cancelled",
      reason,
    );

    if (result.error) {
      showToast(\`Failed to update order: \${result.error}\`, "error");
    } else {
      showToast(actionCopy("Cancel", confirmAction.order.orderNumber).done, "success");
      await fetchOrders();
      setConfirmAction(null);
      setSelectedOrder(null);
    }
    
    setIsProcessing(false);
  };
`;

c = c.replace(
  /const handleConfirmAction = async \(\) => \{[\s\S]*?setIsProcessing\(false\);\s*\};/,
  handleConfirmActionReplacement
);

// Now inject the CancelReasonModal below the Dialog
const dialogRegex = /(<Dialog[\s\S]*?<\/Dialog>)/;
const injected = `$1\n\n      <CancelReasonModal 
        isOpen={confirmAction !== null && confirmAction.type === "Cancel"}
        order={confirmAction?.type === "Cancel" ? confirmAction.order : null}
        isProcessing={isProcessing}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleCancelConfirm}
      />`;
c = c.replace(dialogRegex, injected);

fs.writeFileSync('app/manage/orders/page.tsx', c);
console.log('patched');
