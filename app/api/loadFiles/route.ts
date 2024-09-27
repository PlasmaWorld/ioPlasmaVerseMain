import path from 'path';
import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to read directories recursively
function readDirRecursive(root: string, filter?: (name: string, index: number, dir: string) => boolean, files?: string[], prefix?: string): string[] {
  prefix = prefix || '';
  files = files || [];
  filter = filter || ((x) => x[0] !== '.');

  const dir = path.join(root, prefix);
  if (!fs.existsSync(dir)) return files;
  if (fs.statSync(dir).isDirectory()) {
    fs.readdirSync(dir)
      .filter((name, index) => filter(name, index, dir))
      .forEach((name) => {
        readDirRecursive(root, filter, files, path.join(prefix, name));
      });
  } else {
    files.push(prefix);
  }

  return files;
}

export async function GET(req: NextRequest) {
  const __dirname = path.resolve();
  const p = path.join(__dirname, '/');

  // Example: Filter to find all .glb files
  const foundFiles = readDirRecursive(p, (file) => file.endsWith('.glb')).filter((str) => str.includes('glb'));

  return NextResponse.json(foundFiles);
}
