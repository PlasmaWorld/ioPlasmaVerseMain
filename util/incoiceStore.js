// util/invoiceStore.js

import fs from 'fs';
import path from 'path';

const invoiceFilePath = path.join(process.cwd(), 'invoiceCount.json');

export const readInvoiceCount = () => {
  if (fs.existsSync(invoiceFilePath)) {
    const data = fs.readFileSync(invoiceFilePath, 'utf-8');
    return JSON.parse(data).count;
  }
  return 1; // Start with invoice count 1 if file does not exist
};

export const writeInvoiceCount = (count) => {
  fs.writeFileSync(invoiceFilePath, JSON.stringify({ count }, null, 2), 'utf-8');
};
