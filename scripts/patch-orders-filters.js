const fs = require('fs');

let pageTsx = fs.readFileSync('app/manage/orders/page.tsx', 'utf8');

if (!pageTsx.includes('OrderFilterPopover')) {
  pageTsx = pageTsx.replace(
    `import { ManagePagination } from "@/components/manage/manage-pagination";`,
    `import { ManagePagination } from "@/components/manage/manage-pagination";\nimport { OrderFilterPopover, type OrderFilterState } from "@/components/manage/orders/order-filter-popover";`
  );

  pageTsx = pageTsx.replace(
    `const [search, setSearch] = useState("");`,
    `const [search, setSearch] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState<OrderFilterState>({});`
  );

  pageTsx = pageTsx.replace(
    `status: dbStatus as any,
          search: search || undefined,
          limit: pageSize,
          offset: (currentPage - 1) * pageSize,`,
    `status: dbStatus as any,
          search: search || undefined,
          ...advancedFilters,
          limit: pageSize,
          offset: (currentPage - 1) * pageSize,`
  );

  pageTsx = pageTsx.replace(
    `[activeStatus, currentPage, pageSize, search, showToast]`,
    `[activeStatus, currentPage, pageSize, search, advancedFilters, showToast]`
  );

  // Add the popover next to the search input
  pageTsx = pageTsx.replace(
    `View KDS
            </Link>
          </div>
        </div>`,
    `View KDS
            </Link>
          </div>
          <div className="flex sm:hidden w-full mt-2 justify-end">
             <OrderFilterPopover filters={advancedFilters} onFilterChange={(f) => { setAdvancedFilters(f); setCurrentPage(1); }} />
          </div>
        </div>`
  );
  
  pageTsx = pageTsx.replace(
    `className="w-full sm:w-[260px] h-[45px] pl-11 pr-4`,
    `className="w-full sm:w-[260px] h-[45px] pl-11 pr-4` // Wait, need a better way to insert next to search box
  );
  
  // Let's replace the whole search/button container to add the filter properly:
  pageTsx = pageTsx.replace(
    `<Link href="/manage/kds" className="bg-[#CD7D39] hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-semibold shadow-sm transition-colors text-center w-full sm:w-auto">
              View KDS
            </Link>`,
    `<OrderFilterPopover filters={advancedFilters} onFilterChange={(f) => { setAdvancedFilters(f); setCurrentPage(1); }} />
            <Link href="/manage/kds" className="bg-[#CD7D39] hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-semibold shadow-sm transition-colors text-center w-full sm:w-auto">
              View KDS
            </Link>`
  );

  // Also remove the `sm:hidden` one I added
  pageTsx = pageTsx.replace(
    `<div className="flex sm:hidden w-full mt-2 justify-end">
             <OrderFilterPopover filters={advancedFilters} onFilterChange={(f) => { setAdvancedFilters(f); setCurrentPage(1); }} />
          </div>`,
    ``
  );

  fs.writeFileSync('app/manage/orders/page.tsx', pageTsx);
}
