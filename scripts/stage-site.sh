#!/usr/bin/env bash
# Serve dist/ under the same base path GitHub Pages uses.
set -euo pipefail
rm -rf dist-ci && mkdir -p dist-ci && cp -R dist dist-ci/mobile-under-pk
