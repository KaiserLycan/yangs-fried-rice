import { useEffect, useState } from "react";
import { getDetailedOrders } from "@/lib/actions/orders";
import { mapStaffOrder, type StaffOrderRow } from "@/lib/orders/map-staff-order";
import type { OrderData } from "@/types/staff-order";
import { Loader2 } from "lucide-react";
import { OrderCard } from "@/components/manage/orders/order-card";

export function CustomerOrderHistory({ customerId }: { customerId: string }) {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      setIsLoading(true);
      setError(null);
      
      const result = await getDetailedOrders({
        customer_id: customerId,
        limit: 10,
        offset: 0,
        include_unpaid: true, 
      });
      
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        const mappedOrders = result.data.data.map(order => 
          mapStaffOrder(order as unknown as StaffOrderRow)
        );
        setOrders(mappedOrders);
      }
      setIsLoading(false);
    }
    loadHistory();
  }, [customerId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8 w-full mt-4">
        <Loader2 className="animate-spin text-accent size-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-backoffice bg-highlight rounded-md border border-field-border w-full mt-4">
        Failed to load history: {error}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground bg-white rounded-md border border-field-border w-full mt-4">
        No orders found for this customer.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full mt-4">
      <h3 className="font-bold text-muted-foreground text-xs tracking-[1.32px] uppercase">
        Recent Orders (Last 10)
      </h3>
      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <OrderCard 
            key={order.orderNumber} 
            order={order} 
          />
        ))}
      </div>
    </div>
  );
}
