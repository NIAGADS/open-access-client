CANARY_SHA=$(git commit-tree 'HEAD^{tree}' \
  -p main \
  -m "Temporary canary release for packages")

git worktree add --detach .worktrees/oa-client-packages-canary "$CANARY_SHA"

cd .worktrees/oa-client-packages-canary

npm ci

npx lerna run build --concurrency 1

npx lerna publish --canary --dist-tag canary --force-publish=*

cd ../.. || exit 1

git worktree remove --force .worktrees/oa-client-packages-canary
