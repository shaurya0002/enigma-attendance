// node scripts/tools.mjs secret        -> random SESSION_SECRET
// node scripts/tools.mjs key           -> random 8-letter ADMIN_KEY
// node scripts/tools.mjs hash <pw>     -> scrypt hash to use instead of a plaintext password in ADMIN_USERS
import crypto from 'node:crypto';
const [cmd, arg] = process.argv.slice(2);
if (cmd === 'secret') console.log(crypto.randomBytes(48).toString('base64url'));
else if (cmd === 'key') {
  const L = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  console.log(Array.from({ length: 8 }, () => L[crypto.randomInt(L.length)]).join(''));
} else if (cmd === 'hash' && arg) {
  const salt = crypto.randomBytes(16);
  console.log(`scrypt$${salt.toString('hex')}$${crypto.scryptSync(arg, salt, 64).toString('hex')}`);
} else console.log('usage: secret | key | hash <password>');
