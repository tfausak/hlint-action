const core = require('@actions/core');
const exec = require('@actions/exec');
const fs = require('fs');
const glob = require('@actions/glob');
const toolCache = require('@actions/tool-cache');

const DEFAULT_CONFIG = '.hlint.yaml';

const DEFAULT_PATTERN = '**/*.hs';

const DEFAULT_VERSION = 'latest';

const LATEST_VERSION = '3.4';

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
    const rawVersion = core.getInput('version') || DEFAULT_VERSION;
    const version = rawVersion === 'latest' ? LATEST_VERSION : rawVersion;

    if (isUndefined(extension) || isUndefined(platform)) {
      throw new Error(`unsupported platform: ${process.platform}`);
    }

    const hlint = await toolCache.downloadTool(buildUrl(version, platform, extension));
    const path = await toolCache.extractTar(hlint);
    core.addPath(`${path}/hlint-${version}`);

    const globber = await glob.create(pattern);
    const files = await globber.glob();

    if (files.length > 0) {
      const arguments = [
        '--cmdthreads',
        '--json',
        '--no-exit-code',
        ...files.sort(),
      ];
      const exists = await isFile(config);
      if (exists) {
        arguments.unshift('--hint', config);
      }

      const chunks = [];
      await exec.exec('hlint', arguments, {
        listeners: {
          stdout: (chunk) => chunks.push(chunk),
        },
      });

      const hints = JSON.parse(chunks.join(''));
      for (const hint of hints) {
        const message = hint.to
          ? `-- Found:\n${hint.from}\n-- Perhaps:\n${hint.to}`
          : `-- Remove:\n${hint.from}`;
        core.warning(message, {
          endColumn: hint.endColumn,
          endLine: hint.endLine,
          file: hint.file,
          startColumn: hint.startColumn,
          startLine: hint.startLine,
          title: `${hint.severity}: ${hint.hint}`,
        });
      }

      if (hints.length > 0) {
        throw new Error(`${hints.length} hint${hints.length === 1 ? '' : 's'}`);
      }
    }
  } catch (error) {
    core.setFailed(error);
  }
})();
