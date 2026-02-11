const http = require('http');

http.get('http://localhost:5000/api/products', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    console.log('API Response:');
    console.log('- Status Code:', res.statusCode);
    console.log('- Products found:', json.products.length);
    
    if (json.products.length > 0) {
      console.log('\nFirst product:');
      const p = json.products[0];
      console.log('  Name:', p.name);
      console.log('  isActive:', p.isActive);
      console.log('  Images count:', p.images?.length || 0);
    }
    
    console.log('\nFull response:', JSON.stringify(json, null, 2));
    process.exit(0);
  });
}).on('error', (e) => {
  console.log('Error:', e.message);
  process.exit(1);
});
