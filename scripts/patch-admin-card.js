const fs = require('fs');
let c = fs.readFileSync('components/manage/orders/order-card.tsx', 'utf8');

c = c.replace(
  `interface OrderCardProps {
  order: OrderData;
  // The onClick handler allows the parent to open the OrderDetailModal when the card itself is clicked.
  onClick?: () => void;
  // The onAction callback handles specific button interactions (Cancel, Deliver, Confirm)
  // independent of the card's main click handler. This triggers the confirmation dialog.
  onAction?: (type: StaffAction, order: OrderData) => void;
}`,
  `interface OrderCardProps {
  order: OrderData;
  // The onClick handler allows the parent to open the OrderDetailModal when the card itself is clicked.
  onClick?: () => void;
  // The onAction callback handles specific button interactions (Cancel, Deliver, Confirm)
  // independent of the card's main click handler. This triggers the confirmation dialog.
  onAction?: (type: StaffAction, order: OrderData) => void;
  
  // Customization
  timerTimestamp?: string | null;
  amberMins?: number;
  redMins?: number;
  hideTimer?: boolean;
  fixedBadge?: { text: string; bgClass: string; textClass: string };
}`
);

c = c.replace(
  `export function OrderCard({ order, onClick, onAction }: OrderCardProps) {
  // Use the exact same 15/25 min red flashing timer as the KDS
  const { timerString, color: timerColor } = useKdsTimer(order.rawCreatedAt);`,
  `export function OrderCard({ order, onClick, onAction, timerTimestamp, amberMins = 15, redMins = 25, hideTimer, fixedBadge }: OrderCardProps) {
  // Use the exact same 15/25 min red flashing timer as the KDS
  const { timerString, color: timerColor } = useKdsTimer(timerTimestamp ?? order.rawCreatedAt, amberMins, redMins);`
);

c = c.replace(
  `        <div
          className={cn(
            "flex justify-between items-start p-4 text-white transition-colors",
            statusConfig[order.status]?.headerBg,
            timerColor === "red" && (order.status === "QUEUE" || order.status === "PREP") && "bg-red-700 animate-pulse",
            timerColor === "amber" && order.status === "PREP" && "bg-amber-600"
          )}
        >`,
  `        <div
          className={cn(
            "flex justify-between items-start p-4 text-white transition-colors",
            statusConfig[order.status]?.headerBg,
            timerColor === "red" && !hideTimer && order.status !== "CANCELED" && order.status !== "COMPLETED" && "bg-red-700 animate-pulse",
            timerColor === "amber" && !hideTimer && order.status !== "CANCELED" && order.status !== "COMPLETED" && "bg-amber-600"
          )}
        >`
);

c = c.replace(
  `              <span className="text-2xl font-bold font-display">
                {order.status === "CANCELED" ? "-" : timerString}
              </span>`,
  `              {fixedBadge ? (
                <span className={\`inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-bold uppercase tracking-wider \${fixedBadge.bgClass} \${fixedBadge.textClass}\`}>
                  {fixedBadge.text}
                </span>
              ) : hideTimer ? null : (
                <span className="text-2xl font-bold font-display">
                  {order.status === "CANCELED" ? "-" : timerString}
                </span>
              )}`
);

fs.writeFileSync('components/manage/orders/order-card.tsx', c);
