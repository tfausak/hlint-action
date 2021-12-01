# HLint action

This is a GitHub Action that checks to make sure that Haskell files are
properly formatted with [HLint][].

[HLint]: https://hackage.haskell.org/package/hlint

## Example

``` yaml
on: push
jobs:
  hlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: tfausak/hlint-action@v1
```

## Options

- `config`: Optional. Defaults to `.hlint.yaml`. The HLint config file to use.
  If this file does not exist, no error will be thrown.

- `pattern`: Optional. Defaults to `**/*.hs`. The Haskell files to lint. If no
  files are found, the action will succeed.

- `version`: Optional. Defaults to `3.3.4`. The version of HLint to use.
  Supports these versions: <https://github.com/ndmitchell/hlint/releases>.
