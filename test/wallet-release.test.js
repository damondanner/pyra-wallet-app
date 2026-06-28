const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const publicRoot = path.join(root, 'public');
const required = [
  "index.html",
  "manifest.webmanifest",
  "offline.html",
  "pyra-wallet-config.json",
  "pyra-wallet-icon.jpg",
  "service-worker.js"
];
for (const file of required) assert(fs.existsSync(path.join(publicRoot, file)), `Missing wallet release file: ${file}`);
for (const forbidden of ['base-sepolia-deployer.html', 'base-sepolia-deployment.json', 'base-mainnet-deployment.json']) {
  assert(!fs.existsSync(path.join(publicRoot, forbidden)), `Private deployment helper leaked: ${forbidden}`);
}
const config = JSON.parse(fs.readFileSync(path.join(publicRoot, 'pyra-wallet-config.json'), 'utf8'));
assert.strictEqual(config.mobileWalletConnection.enabled, false);
assert.strictEqual(config.mobileWalletConnection.projectId, '');
assert.strictEqual(config.api.memberStatus.enabled, false);
assert.strictEqual(config.api.memberStatus.baseUrl, '');
const html = fs.readFileSync(path.join(publicRoot, 'index.html'), 'utf8');
assert(html.includes('Member wallet for the PYRA member-only trade network.'));
assert(html.includes('wallet_confirmation_required: true'));
const serviceWorker = fs.readFileSync(path.join(publicRoot, 'service-worker.js'), 'utf8');
assert(!serviceWorker.includes('base-sepolia-deployer'));
console.log('public wallet release test passed');
