const fs = require('fs');

let file = 'components/menu/menu-screen.tsx';
let content = fs.readFileSync(file, 'utf8');

// Find where ItemDetailModal is called
content = content.replace(
  '<ItemDetailModal\\n        product={selectedProduct}\\n        isGuest={isGuest}',
  '<ItemDetailModal\\n        product={selectedProduct}\\n        isGuest={isGuest}\\n        cartTotalItems={(optimisticCartLines ?? []).reduce((acc, line) => acc + line.quantity, 0)}\\n        cartProductItems={(optimisticCartLines ?? []).filter(l => l.name === selectedProduct?.name).reduce((acc, line) => acc + line.quantity, 0)}'
);

fs.writeFileSync(file, content, 'utf8');
