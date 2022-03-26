#!/bin/bash
set -e
git merge origin/main -m "merge latest changes"
npx rollup -c
git add .
git commit -m "build pages"
git push origin gh-pages
