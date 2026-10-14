import {copyFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const destination=fileURLToPath(new URL('../apps/web/public/',import.meta.url));mkdirSync(destination,{recursive:true});
copyFileSync(require.resolve('pdfjs-dist/build/pdf.worker.min.mjs'),destination+'pdf.worker.min.mjs');
copyFileSync(require.resolve('pdfjs-dist/LICENSE'),destination+'pdfjs.LICENSE.txt');
