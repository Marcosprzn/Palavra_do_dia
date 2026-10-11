const assert = require('assert');

async function runTest() {
  console.log('--- Testing WhatsApp Service Logic ---');

  const whatsappService = require('../server/services/whatsappService');

  // 1. Test formatJid
  assert.strictEqual(whatsappService.formatJid('5511999998888'), '5511999998888@s.whatsapp.net');
  assert.strictEqual(whatsappService.formatJid('5511999998888@s.whatsapp.net'), '5511999998888@s.whatsapp.net');
  assert.strictEqual(whatsappService.formatJid('120363024567890123@g.us'), '120363024567890123@g.us');
  console.log('✓ formatJid properly handles numbers and group jids');

  // 2. Test initial status
  const status = whatsappService.getConnectionStatus();
  assert.ok(status.state, 'Status must have state');
  console.log('✓ Initial connection status verified:', status.state);

  // 3. Test mock Socket.IO emission
  const emittedEvents = [];
  const mockIo = {
    emit: (event, data) => {
      emittedEvents.push({ event, data });
    }
  };

  whatsappService.setSocketIo(mockIo);
  whatsappService.broadcastStatus('connecting');

  assert.strictEqual(whatsappService.getConnectionStatus().state, 'connecting');
  const lastEmit = emittedEvents.find(e => e.event === 'connection_status');
  assert.ok(lastEmit, 'Should emit connection_status event');
  assert.strictEqual(lastEmit.data.state, 'connecting');
  console.log('✓ broadcastStatus updates state and emits to socket.io');

  // 4. Test formatMessagePayload
  const textPayload = whatsappService.formatMessagePayload('Texto de teste', null);
  assert.deepStrictEqual(textPayload, { text: 'Texto de teste' });

  const fs = require('fs');
  const path = require('path');
  const tempImg = path.join(__dirname, 'temp_test_image.jpg');
  fs.writeFileSync(tempImg, 'fake image data');

  const imagePayload = whatsappService.formatMessagePayload('Legenda bíblica', tempImg);
  assert.ok(imagePayload.image, 'Payload should have image object');
  assert.strictEqual(imagePayload.caption, 'Legenda bíblica');

  fs.unlinkSync(tempImg);
  console.log('✓ formatMessagePayload handles text and image+caption correctly');

  console.log('ALL WHATSAPP SERVICE TESTS PASSED!');
}

runTest().catch((err) => {
  console.error('WhatsApp Service Test Failed:', err);
  process.exit(1);
});
