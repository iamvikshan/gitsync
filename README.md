<div align="center">

[![wakatime](https://wakatime.com/badge/user/8535571c-1079-48d4-ac47-11a817f61249/project/c57869a3-8a13-4cc7-b4f3-8fab999f5595.svg)](https://wakatime.com/badge/user/8535571c-1079-48d4-ac47-11a817f61249/project/c57869a3-8a13-4cc7-b4f3-8fab999f5595)
[![Releases](https://github.com/iamvikshan/gitsync/actions/workflows/release.yml/badge.svg)](https://github.com/iamvikshan/gitsync/actions/workflows/release.yml)
[![CLA Assistant](https://github.com/iamvikshan/gitsync/actions/workflows/cla.yml/badge.svg)](https://github.com/iamvikshan/gitsync/actions/workflows/cla.yml)

</div>

# GitHub GitLab Sync Action

A powerful GitHub Action that provides bi-directional synchronization between GitHub and GitLab
repositories. Keep your projects in sync across platforms automatically.

## ✨ Key Features

- 🔄 **Bi-directional sync** between GitHub and GitLab
- 🌳 **Branches, PRs/MRs, issues, releases, and tags**
- 💬 **Enhanced comment synchronization** with proper attribution
- 🤖 **Smart bot branch handling** - configurable cleanup of dependabot, renovate, qodana, copilot
  and other bot branches
- ⚙️ **Highly configurable** with logical priority-based defaults
- 🔒 **Secure** with token-based authentication
- 🏷️ **Smart labeling** of synced content
- 🧠 **Intelligent dependency management** - automatically enables required features
- ⏱️ **Chronological sync order** - respects dependencies between operations
- 🏗️ **Automatic repository creation** - creates missing remote repositories as private by default

> [!WARNING]
>
> some actions applied to your repositories by this GitHub Action are DESTRUCTIVE. Please review
> configuration options carefully before enabling, proceed at your own risk.

## 🚀 Quick Start

### 1. Create Workflow File

Create `.github/workflows/sync.yml`:

```yaml
name: Sync to GitLab
on:
  push:
    branches: [main]
  pull_request:
    types: [opened, closed, reopened]
  issues:
    types: [opened, closed, reopened]
  release:
    types: [published]
  schedule:
    - cron: '0 */6 * * *'
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v6.0.2

      - name: Sync with GitLab
        uses: iamvikshan/gitsync@v1.0.1
        with:
          GITLAB_TOKEN: ${{ secrets.GITLAB_TOKEN }}
          GH_TOKEN: ${{ secrets.GH_TOKEN }}
```

### 2. Set Up Tokens

Add these secrets to your GitHub repository:

- `GITLAB_TOKEN`: GitLab personal access token with `api` scope
- `GH_TOKEN`: GitHub personal access token with `workflow` scope (required for syncing workflow
  files)

> [!IMPORTANT]
>
> If your sync includes workflow files (`.github/workflows/`), you **must** use a Personal Access
> Token with the `workflow` scope instead of the default `GITHUB_TOKEN`. The default token cannot
> modify workflow files for security reasons.

### 3. Basic Configuration (Optional)

Create `.github/sync-config.yml` for custom settings:

```yaml
gitlab:
  enabled: true
  projectId: 12345 # Your GitLab project ID

github:
  enabled: true
```

That's it! The action uses intelligent defaults:

- ✅ **Enabled by default**: Branches (with history sync), Tags, Releases
- ❌ **Disabled by default**: Pull Requests, Issues, Comments (can be noisy)
- 🧠 **Smart dependencies**: Automatically enables required features (e.g., tags when releases are
  enabled)

🎉

## 📖 Documentation

For detailed configuration and advanced usage:

- **[Configuration Guide](docs/CONFIGURATION.md)** - Complete configuration reference
- **[Examples](docs/EXAMPLES.md)** - Real-world configuration examples
- **[Token Setup](docs/TOKEN.md)** - Detailed token permissions and setup instructions
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions

## 🤝 Need Help?

- 📋 [Configuration Examples](docs/sync-config-example.yml) - Ready-to-use configuration templates
- 🐛 [Report Issues](https://github.com/iamvikshan/gitsync/issues) - Found a bug or have a feature
  request?
- 💬 [Discussions](https://github.com/iamvikshan/gitsync/discussions) - Ask questions and share
  ideas

## 🤝 Contributing

We welcome contributions! Please see our
[Contributing Guide](https://github.com/iamvikshan/.github/blob/main/.github/CONTRIBUTING.md) for
details.

## 📄 License

MIT License - see the [LICENSE](https://github.com/iamvikshan/.github/blob/main/.github/LICENSE.md)
file for details.

---

<div align="center">

**Built with 🖤 using [TypeScript](https://www.typescriptlang.org/) and [Bun](https://bun.sh/)**

_Inspired by the need for seamless cross-platform development workflows_

</div>
