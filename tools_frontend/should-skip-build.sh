#!/usr/bin/env bash

if [[ -z "${VERCEL_GIT_PREVIOUS_SHA:-}" ]]; then
  exit 1
fi

build_inputs=(
  ':/tools_frontend/'
  ':/tools_shared/'
  ':/patches/'
  ':/package.json'
  ':/pnpm-lock.yaml'
  ':/pnpm-workspace.yaml'
  ':/turbo.json'
  ':/tsconfig.json'
  ':/.node-version'
  ':/.npmrc'
)

# Vercel skips on 0. Build if an input changed or Git cannot compare the revisions.
git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" HEAD -- "${build_inputs[@]}" || exit 1
