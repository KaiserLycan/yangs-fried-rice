const fs = require('fs');
let c = fs.readFileSync('components/manage/orders/order-sidebar.tsx', 'utf8');

if (!c.includes('isManager')) {
  c = c.replace(
    `interface OrderSidebarProps {
  activeStatus: OrderStatus;
  onStatusChange: (status: OrderStatus) => void;
}`,
    `interface OrderSidebarProps {
  activeStatus: OrderStatus;
  onStatusChange: (status: OrderStatus) => void;
  isManager?: boolean;
}`
  );

  c = c.replace(
    `export function OrderSidebar({ activeStatus, onStatusChange }: OrderSidebarProps) {`,
    `export function OrderSidebar({ activeStatus, onStatusChange, isManager = false }: OrderSidebarProps) {`
  );
  
  c = c.replace(
    `{statuses.map((status) => {`,
    `{statuses.filter(s => s !== "Payment Issues" || isManager).map((status) => {`
  );
}

fs.writeFileSync('components/manage/orders/order-sidebar.tsx', c);
