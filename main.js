const core = require('@actions/core');
const exec = require('@actions/exec');
const fs = require('fs');
const glob = require('@actions/glob');
const toolCache = require('@actions/tool-cache');
const util = require('util');

const DEFAULT_CONFIG = '.hlint.yaml';

const DEFAULT_PATTERN = 'Example.hs'; // '**/*.hs';

const DEFAULT_VERSION = '3.3.4';

const EXTENSIONS = {
  darwin: '.tar.gz',
  linux: '.tar.gz',
  win32: '.zip'
};

const PLATFORMS = {
  darwin: 'osx',
  linux: 'linux',
  win32: 'windows',
};

const buildUrl = (version, platform, extension) =>
  `https://github.com/ndmitchell/hlint/releases/download/v${version}/hlint-${version}-x86_64-${platform}${extension}`;

const isFile = (path) =>
  new Promise((resolve) => fs.stat(path, (error, stats) => resolve(!error && stats.isFile())));

const isUndefined = (x) =>
  typeof x === 'undefined';

(async () => {
  try {
    const config = core.getInput('config') || DEFAULT_CONFIG;
    const extension = EXTENSIONS[process.platform];
    const pattern = core.getInput('pattern') || DEFAULT_PATTERN;
    const platform = PLATFORMS[process.platform];
    const version = core.getInput('version') || DEFAULT_VERSION;

    if (isUndefined(extension) || isUndefined(platform)) {
      throw new Error(`unsupported platform: ${process.platform}`);
    }

    const hlint = await toolCache.downloadTool(buildUrl(version, platform, extension));
    const path = await toolCache.extractTar(hlint);
    core.addPath(`${path}/hlint-${version}`);

    const globber = await glob.create(pattern);
    const files = await globber.glob();

    if (files.length > 0) {
      console.log(`::add-matcher::${__dirname}/problem-matcher.json`);

      const arguments = [...files.sort()];
      const exists = await isFile(config);
      if (exists) {
        arguments.unshift('--hint', config);
      }
      await exec.exec('hlint', arguments);
    }
  } catch (error) {
    core.setFailed(error);
  }
})();
