const http = require('http');

setTimeout(() => {
  http.get('http://localhost:5000/api/products', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const json = JSON.parse(data);
      console.log('✓ API Status:', res.statusCode);
      console.log('✓ Products found:', json.products.length);
      
      if (json.products.length > 0) {
        console.log('\nFirst 2 products:');
        json.products.slice(0, 2).forEach((p, i) => {
          console.log(`  ${i+1}. ${p.name}`);
          if (p.images && p.images[0]) {
            console.log(`     Image: ${p.images[0].substring(0, 60)}...`);
          }
        });
        process.exit(0);
      } else {
        process.exit(1);
      }
    });
  }).on('error', (e) => {
    console.log('✗ Error:', e.message);
    process.exit(1);
  });
}, 2000);
