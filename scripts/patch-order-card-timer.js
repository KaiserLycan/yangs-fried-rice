const fs = require('fs');
let c = fs.readFileSync('components/manage/orders/order-card.tsx', 'utf8');

c = c.replace(
  /import type \{ OrderData \} from "@\/types\/staff-order";/,
  `import type { OrderData } from "@/types/staff-order";\nimport { useKdsTimer } from "@/hooks/use-kds-timer";`
);

c = c.replace(
  /export function OrderCard\(\{ order, onClick, onAction \}: OrderCardProps\) \{/,
  `export function OrderCard({ order, onClick, onAction }: OrderCardProps) {
  const { timerString, color: timerColor } = useKdsTimer(order.rawCreatedAt);`
);

// Modify headerBg logic
c = c.replace(
  /const config = statusConfig\[order\.status\];\r?\n\s+const primary = primaryActionFor\(order\);/,
  `const config = statusConfig[order.status];
  const primary = primaryActionFor(order);
  
  // Timer overrides colors only for active orders (QUEUE/PREP)
  let headerBg = config.headerBg;
  if ((order.status === "QUEUE" || order.status === "PREP") && timerColor === "red") {
    headerBg = "bg-red-700 animate-pulse";
  } else if ((order.status === "QUEUE" || order.status === "PREP") && timerColor === "amber") {
    headerBg = "bg-amber-600";
  }`
);

c = c.replace(
  /config\.headerBg/,
  `headerBg`
);

c = c.replace(
  /\{order\.timer && \(\r?\n\s+<div className="text-lg font-bold tracking-wider leading-none">\r?\n\s+\{order\.timer\}\r?\n\s+<\/div>\r?\n\s+\)\}/,
  `{(order.status === "QUEUE" || order.status === "PREP") && (
              <div className="text-lg font-bold tracking-wider leading-none">
                {timerString}
              </div>
            )}`
);

// Make sure special instructions are rendered for the entire order
// Phase 6 mentions "special instructions"
// The card currently only renders `item.instructions`. Let's add `order.orderInfo.specialInstructions` at the bottom if present.
if (!c.includes("order.orderInfo.specialInstructions")) {
  c = c.replace(
    /<\/div>\r?\n\s+<\/div>\r?\n\s+\{primary && \(/,
    `</div>
        </div>
        {order.orderInfo.specialInstructions && (
          <div className="p-4 bg-yellow-50 border-t border-yellow-200 shrink-0">
            <span className="font-bold text-xs text-yellow-800 uppercase tracking-widest">Order Note:</span>
            <p className="text-sm text-yellow-900 mt-1 font-medium">{order.orderInfo.specialInstructions}</p>
          </div>
        )}
        {primary && (`
  );
}

fs.writeFileSync('components/manage/orders/order-card.tsx', c);
