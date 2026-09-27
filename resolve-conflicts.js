const fs = require('fs');

function resolve(file, strategy) {
    let content = fs.readFileSync(file, 'utf8');
    const regex = /<<<<<<< HEAD\r?\n([\s\S]*?)=======\r?\n([\s\S]*?)>>>>>>> development\r?\n?/g;
    let replaced = false;
    content = content.replace(regex, (match, head, dev) => {
        replaced = true;
        if (strategy === 'HEAD') return head;
        if (strategy === 'DEV') return dev;
        if (strategy === 'BOTH') return head + dev;
        if (typeof strategy === 'function') return strategy(head, dev);
        return match;
    });
    if (replaced) {
        fs.writeFileSync(file, content);
        console.log(`Resolved: ${file}`);
    } else {
        console.log(`No match: ${file}`);
    }
}

// 17. components/orders/track-order-screen.tsx
resolve('components/orders/track-order-screen.tsx', 'BOTH');

// 18. lib/orders/read-tracked-order.ts
resolve('lib/orders/read-tracked-order.ts', 'BOTH');

console.log("Done");
