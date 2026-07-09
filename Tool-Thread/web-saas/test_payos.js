const payosMod = require('@payos/node');
const { PayOS } = payosMod;
const payos = new PayOS({clientId: '1', apiKey: '2', checksumKey: '3'});
console.log(payos.webhooks.verify.toString());
