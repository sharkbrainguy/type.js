#!/bin/sh
mkdir -p dist
cat src/type.js \
    src/contracts.js \
    src/multimethods.js \
    src/proxy.js \
    src/interface.js \
    > dist/type.js
