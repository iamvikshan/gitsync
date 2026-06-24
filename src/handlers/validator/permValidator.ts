// src/handlers/validator/permValidator.ts
import { PermissionCheck } from '../../../types'
import * as core from '@actions/core'

export class PermissionValidator {
  static async validatePlatformPermissions(
    platform: 'github' | 'gitlab',
    checks: PermissionCheck[],
    sync: unknown,
    repoInfo: string,
  ): Promise<void> {
    core.startGroup(`🔍 ${platform.toUpperCase()} Permissions Validation`)
    core.info(
      `\x1b[36mValidating ${platform} permissions for: ${repoInfo}\x1b[0m`,
    )

    for (const check of checks) {
      if (sync?.[check.feature as keyof typeof sync]?.enabled) {
        try {
          await check.check()
          core.info(`\x1b[32m✓ ${check.feature} permissions verified\x1b[0m`)
        } catch {
          const errorMessage = `${platform}: ${check.warningMessage}`
          core.setFailed(`\x1b[31m✖ ${errorMessage}\x1b[0m`)
          throw new Error(errorMessage)
        }
      }
    }

    core.endGroup()
  }
}
