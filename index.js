#!/usr/bin/env node

let fs = require('fs');
let path = require('path');

let minimist = require('minimist');
let opn = require('opn');
let spawnAsync = require('@expo/spawn-async');

async function getGitRepositoryUrlAsync(file) {
  let { stdout } = await spawnAsync('git', ['config', '--get', 'remote.origin.url'], {
    cwd: path.dirname(file),
  });
  return stdout.trim();
}

async function getGitRepositoryRootDirectoryAsync(file) {
  let { stdout } = await spawnAsync('git', ['rev-parse', '--show-toplevel'], {
    cwd: path.dirname(file),
  });
  return stdout.trim();
}

async function getRelativePathAsync(file) {
  let root = await getGitRepositoryRootDirectoryAsync(file);
  return path.relative(root, file);
}

async function getCurrentBranchAsync(file) {
  let { stdout } = await spawnAsync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
    cwd: path.dirname(file),
  });
  return stdout.trim();
}

async function getGithubUrlAsync(file, opts) {
  opts = opts || {};
  let isDir = fs.lstatSync(file).isDirectory();
  let branch = await getCurrentBranchAsync(file);
  let relativePath = await getRelativePathAsync(file);
  let repo = await getGitRepositoryUrlAsync(file);
  let repoWeb = repo.substr(0, repo.length - 4);
  let url;
  if (opts.raw) {
    let repoRaw = repoWeb.replace(/github\.com/, 'raw.githubusercontent.com');
    url = [repoRaw, branch, relativePath].join('/');
  } else {
    let type = isDir ? 'tree' : 'blob';
    url = [repoWeb, type, branch, relativePath].join('/');
  }
  if (opts.open) {
    opn(url);
  }
  return url;
}

module.exports = getGithubUrlAsync;

Object.assign(module.exports, {
  getGithubUrlAsync,
  getGitRepositoryUrlAsync,
  getGitRepositoryRootDirectoryAsync,
  getCurrentBranchAsync,
});

if (require.main === module) {
  (async function() {
    let args = minimist(process.argv.slice(2));
    if (args._.length > 0) {
      for (let x of args._) {
        try {
          let url = await getGithubUrlAsync(x, args);
          console.log(url);
        } catch (e) {
          console.error("Couldn't figure out URL for " + JSON.stringify(x) + ' | ' + e.message);
          console.log();
        }
      }
    } else {
      console.error(`
    Prints out the Github URL for a file on your file system

    Usage:

        github-url <file1> <file2> [--raw]
    `);
    }
  })();
}
