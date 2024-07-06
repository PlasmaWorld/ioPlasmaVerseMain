// util/dataStore.ts

import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data.json');

export const readData = () => {
  if (fs.existsSync(dataFilePath)) {
    const data = fs.readFileSync(dataFilePath, 'utf-8');
    return JSON.parse(data);
  }
  return {};
};

export const writeData = (data) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
};
