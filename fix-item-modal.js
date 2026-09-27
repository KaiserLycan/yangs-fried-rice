const fs = require('fs');
let file = 'components/menu/item-detail-modal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add limits import
content = content.replace(
  'import { MIN_QUANTITY } from "@/lib/menu/quantity";',
  'import { MIN_QUANTITY, MAX_QUANTITY } from "@/lib/menu/quantity";\nimport { wouldExceedOrderCap } from "@/lib/cart/limits";'
);

// Add props
content = content.replace(
  'isGuest?: boolean;',
  'isGuest?: boolean;\n  cartTotalItems?: number;\n  cartProductItems?: number;'
);
content = content.replace(
  'isGuest = false,',
  'isGuest = false,\n  cartTotalItems = 0,\n  cartProductItems = 0,'
);

// Disable logic
content = content.replace(
  'const lineTotal = formatPeso((product.price + addOnsTotal) * quantity);',
  \const lineTotal = formatPeso((product.price + addOnsTotal) * quantity);

  // Issue 115 Batch B & C
  const isOverOrderCap = wouldExceedOrderCap(cartTotalItems, editing ? quantity - editing.quantity : quantity);
  const isOverProductCap = (cartProductItems + (editing ? quantity - editing.quantity : quantity)) > MAX_QUANTITY;
  const isCapped = isOverOrderCap || isOverProductCap;\
);

content = content.replace(
  'disabled={pending || !product!.isAvailable}',
  'disabled={pending || !product!.isAvailable || isCapped}'
);

content = content.replace(
  'disabled={pending || !product.isAvailable}',
  'disabled={pending || !product.isAvailable || isCapped}'
);

fs.writeFileSync(file, content, 'utf8');
