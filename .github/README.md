# GitHub Actions

This directory contains the repository's continuous integration and deployment workflows. GitHub Actions loads the YAML files in this directory; this README is documentation only.

## Workflows

### PR Build (`pull-request.yml`)

Runs when a pull request is opened, updated, or reopened. The workflow installs the npm workspace dependencies, verifies Prettier formatting, builds all packages, and runs the GenomicsDB-specific build using its development environment file.

Dependabot pull requests use this workflow for the same validation as maintainer-authored pull requests. See [Dependabot](#dependabot) for the repository's security update policy.

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

Dependabot security automation uses two complementary controls:

- Repository Dependabot rules select which vulnerability alerts may open pull requests.
- [`dependabot.yml`](dependabot.yml) controls npm update scope and security pull request behavior.

### Repository settings and rules

The repository must have **Dependency graph** and **Dependabot alerts** enabled. Keep the blanket **Dependabot security updates** setting disabled so that only matching custom rules can open security update pull requests.

Create one enabled rule for each package and severity combination:

| Package | Severities |
| --- | --- |
| `next` | High and Critical |
| `react` | High and Critical |
| `react-dom` | High and Critical |

This produces six rules because GitHub treats High and Critical as separate severity values. Each rule must:

- Target the npm ecosystem, one package, one severity, and alerts with a patch available.
- Open a pull request to resolve matching alerts.
- Leave automatic alert dismissal disabled.

Rules that do not match remain visible as Dependabot alerts and do not create pull requests.

### YAML configuration

The YAML configuration is intended to:

- Disable scheduled version-update pull requests with `open-pull-requests-limit: 0`.
- Allow updates only for `next`, `react`, and `react-dom`.
- Group compatible security updates for those packages when possible.
- Use the npm workspace manifests and root lockfile when preparing updates.

For multiple or globbed manifest paths, use the `directories` key. Do not combine the package allowlist with `ignore: "*"`; Dependabot applies `ignore` after `allow`, so the wildcard would block the allowed packages too.

Dependabot does not merge pull requests automatically. Matching pull requests run the normal PR Build workflow and require the repository's usual human review and merge process.

See GitHub's documentation for [Dependabot configuration](https://docs.github.com/en/code-security/concepts/supply-chain-security/about-the-dependabot-yml-file) and [custom auto-triage rules](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/manage-your-dependency-security/auto-triage-dependabot-alerts).
