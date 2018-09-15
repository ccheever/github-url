#!/usr/bin/env node

let fs = require('fs');
let path = require('path');

let opn = require('opn');

let githubUrl = require('.');

async function mainAsync(file) {
  let isDir = fs.lstatSync(file).isDirectory();
  if (isDir) {
    let readme = path.join(file, 'README.md');
    if (fs.existsSync(readme)) {
      file = readme;
    }
  }

  await githubUrl(file, { open: true });
  process.exit(0);
}

module.exports = mainAsync;

if (require.main === module) {
  mainAsync(process.argv[2] || '.');
}
