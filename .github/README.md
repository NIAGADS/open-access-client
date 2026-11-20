# GitHub Actions

This directory contains the repository's continuous integration and deployment workflows. GitHub Actions loads the YAML files in this directory; this README is documentation only.

## Workflows

### PR Build (`pull-request.yml`)

Runs when a pull request is opened, updated, or reopened. The workflow installs the npm workspace dependencies, verifies Prettier formatting, builds all packages, and runs the GenomicsDB-specific build using its development environment file.

Dependabot pull requests use this workflow for the same validation as maintainer-authored pull requests. Dependabot security update behavior is configured in [`../dependabot.yml`](../dependabot.yml).

### Publish Storybook (`publish-storybook.yml`)

Runs after a push to `main`. It builds the workspace and Storybook, then publishes `apps/storybook/storybook-static` to GitHub Pages.

The workflow requires `pages: write` and `id-token: write` permissions.

### Staging Release (`staging-release.yml`)

Runs when a pull request targeting `main` is closed, but its jobs only run when the pull request was merged.

The workflow:

1. Creates a synthetic commit from the pull request head tree and publishes canary package versions to npm with the `canary` distribution tag.
2. Builds and pushes staging container images for `adsp` and `niagads-main` after the canary publication succeeds.
3. Deploys both applications to the staging server through AWS Systems Manager and fails if the remote deployment does not report `Success`.

Repository configuration required by the staging deployment:

| Type | Name | Purpose |
| --- | --- | --- |
| Secret | `AWS_ACCESS_KEY_ID` | Authenticates AWS operations. |
| Secret | `AWS_SECRET_ACCESS_KEY` | Authenticates AWS operations. |
| Secret | `INSTANCE_ID` | Identifies the staging EC2 instance targeted by SSM. |
| Variable | `AWS_REGION` | Selects the AWS region for ECR and SSM operations. |
| Variable | `ECR_REGISTRY` | Identifies the container registry used by the deployment scripts. |

Publishing canary packages also relies on npm trusted publishing through GitHub Actions OIDC.

## Dependabot
