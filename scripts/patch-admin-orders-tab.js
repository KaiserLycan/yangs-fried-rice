const fs = require('fs');
let c = fs.readFileSync('app/manage/orders/page.tsx', 'utf8');

c = c.replace(
  `      // 1. Fetch the summaries using server-side pagination & filtering
      const summaryResult = await getDetailedOrders({
        status: dbStatus as any,
        search: search || undefined,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
      });

      if (summaryResult.error) {
        showToast(\`Failed to load orders: \${summaryResult.error}\`, "error");
      }

      if (summaryResult.data) {
        const { data: detailedOrders, totalCount } = summaryResult.data;
        
        // Calculate and update total pages based on count
        setTotalPages(Math.max(1, Math.ceil(totalCount / pageSize)));
        
        // Shared with the KDS: real delivery fee, real total, formatted order type.
        const mappedOrders: OrderData[] = detailedOrders
          .filter((res) => res !== null)
          .map((order) => mapStaffOrder(order as unknown as StaffOrderRow));

        // Newest first, exactly as the server sent it (P53). Re-sorting here
        // only ever reordered one page, so page 2 could hold newer orders than
        // the bottom of page 1.
        setOrders(mappedOrders);
      }`,
  `      // 1. Fetch the summaries using server-side pagination & filtering
      if (uiTab === "payment issues") {
        const issuesResult = await getPaymentIssuesForAdmin();
        if (issuesResult.error) {
          showToast(\`Failed to load issues: \${issuesResult.error}\`, "error");
        } else if (issuesResult.data) {
          const detailedOrders = issuesResult.data.map((issue: PaymentIssueOrder) => issue.order);
          setTotalPages(1); // Payment issues are unpaginated for now
          
          const mappedOrders: OrderData[] = detailedOrders
            .filter((res) => res !== null)
            .map((order) => mapStaffOrder(order as unknown as StaffOrderRow));
            
          setOrders(mappedOrders);
        }
      } else {
        const summaryResult = await getDetailedOrders({
          status: dbStatus as any,
          search: search || undefined,
          limit: pageSize,
          offset: (currentPage - 1) * pageSize,
        });

        if (summaryResult.error) {
          showToast(\`Failed to load orders: \${summaryResult.error}\`, "error");
        }

        if (summaryResult.data) {
          const { data: detailedOrders, totalCount } = summaryResult.data;
          
          // Calculate and update total pages based on count
          setTotalPages(Math.max(1, Math.ceil(totalCount / pageSize)));
          
          // Shared with the KDS: real delivery fee, real total, formatted order type.
          const mappedOrders: OrderData[] = detailedOrders
            .filter((res) => res !== null)
            .map((order) => mapStaffOrder(order as unknown as StaffOrderRow));

          // Newest first, exactly as the server sent it (P53). Re-sorting here
          // only ever reordered one page, so page 2 could hold newer orders than
          // the bottom of page 1.
          setOrders(mappedOrders);
        }
      }`
);

fs.writeFileSync('app/manage/orders/page.tsx', c);
