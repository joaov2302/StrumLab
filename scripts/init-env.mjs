import { randomBytes } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const path = fileURLToPath(new URL('../.env', import.meta.url));
if (existsSync(path)) {
  console.log('.env já existe; preservado.');
} else {
  writeFileSync(path, `POSTGRES_DB=strumlab\nPOSTGRES_USER=strumlab\nPOSTGRES_PASSWORD=${randomBytes(32).toString('hex')}\nDATABASE_URL=jdbc:postgresql://127.0.0.1:5433/strumlab\nAPI_BASE_URL=http://127.0.0.1:8080\n`, { mode: 0o600 });
  console.log('.env local criado com senha aleatória.');
}
