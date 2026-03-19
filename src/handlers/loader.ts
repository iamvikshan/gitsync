import * as core from '@actions/core'
import * as fs from 'fs'
import * as yaml from 'js-yaml'
import { ConfigSchema, Config } from '../../types'
import { ZodError, type ZodIssue } from 'zod'
import { getDefaultConfig } from '@utils/defaults'
import { getActionInput, logConfigDetails } from './inputs'
import { processConfig } from './reason'
import { validateConfig } from './validator'
import { ErrorCodes } from '../utils/errorCodes'
import { mergeWithDefaults } from '../utils/configMerger'

/**
 * Normalize YAML arrays that might be parsed as objects
 * This handles cases where YAML arrays like ["item1", "item2"] get parsed as objects
 */
function normalizeYamlArrays(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(normalizeYamlArrays)
  }

  if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      // Check if this looks like an array that was parsed as an object
      if (
        key === 'labels' &&
        value &&
        typeof value === 'object' &&
        !Array.isArray(value)
      ) {
        const values = Object.values(value)
        // If all values are strings and keys are numeric-like, convert to array
        if (values.every(v => typeof v === 'string')) {
          const keys = Object.keys(value)
          const isNumericKeys = keys.every(k => /^\d+$/.test(k))
          if (isNumericKeys) {
            result[key] = values
            continue
          }
        }
      }
      result[key] = normalizeYamlArrays(value)
    }
    return result
  }

  return obj
}

export async function loadConfig(): Promise<Config> {
  // Log the start of config loading with a colorful group
  core.startGroup('🔍 Configuration Loading')
  core.info('\x1b[34m🚀 Initializing configuration...\x1b[0m')

  try {
    const CONFIG_PATH = getActionInput('CONFIG_PATH', false)
    const configPath = CONFIG_PATH || '.github/sync-config.yml'
    const defaultConfig = getDefaultConfig()

    // Log configuration path
    if (CONFIG_PATH) {
      core.info(
        `\x1b[36m⚠️ Using custom configuration file: ${CONFIG_PATH}\x1b[0m`
      )
    }

    // If config file doesn't exist, use default configuration
    if (!fs.existsSync(configPath)) {
      core.info(
        `\x1b[33m⚠️ ${ErrorCodes.EFS01}: Using default configuration.\x1b[0m`
      )
      const validatedConfig = await validateConfig(defaultConfig)
      logConfigDetails(validatedConfig)
      core.endGroup()
      return validatedConfig
    }

    const configContent = fs.readFileSync(configPath, 'utf8')

    // If config file is empty or just whitespace
    if (!configContent.trim()) {
      core.endGroup()
      core.setFailed(
        `\x1b[33m⚠️ ${ErrorCodes.ECFG02}: Empty configuration file.\x1b[0m`
      )
    }

    let parsedConfig: Record<string, unknown>

    try {
      parsedConfig = yaml.load(configContent) as Record<string, unknown>
    } catch (yamlError) {
      core.warning(
        `${ErrorCodes.ECFG01}: YAML parsing error: ${(yamlError as Error).message}`
      )
      // Try to fix common YAML syntax errors
      const fixedContent = (configContent as string)
        .replace(/:\s*([truefals]{4,})\s*$/gim, ': $1') // Fix missing quotes
        .replace(/^\s*([^:]+?)\s*[=]\s*(.+)$/gm, '$1: $2') // Fix = instead of :

      try {
        parsedConfig = yaml.load(fixedContent) as Record<string, unknown>
        core.info('⚠️ Fixed YAML syntax errors automatically')
      } catch {
        throw yamlError // If still can't parse, throw original error
      }
    }

    // Post-process the parsed config to handle YAML array parsing issues
    parsedConfig = normalizeYamlArrays(parsedConfig) as Record<string, unknown>

    // If parsed config is null or empty
    if (!parsedConfig || Object.keys(parsedConfig).length === 0) {
      core.endGroup()
      core.setFailed('\x1b[33m⚠️ Empty or invalid configuration.\x1b[0m')
    }

    // Process the config, converting boolean-like fields
    const reasonedConfig = processConfig(parsedConfig)

    try {
      // Merge user config with defaults
      const mergedConfig = mergeWithDefaults(reasonedConfig, defaultConfig)

      // Validate the merged config
      const config = ConfigSchema.parse(mergedConfig)

      // Validate and augment tokens
      const validatedConfig = await validateConfig(config)

      // Log configuration details (with tokens hidden)
      logConfigDetails(validatedConfig)

      core.info('\x1b[32m✓ Configuration loaded successfully!\x1b[0m')
      core.endGroup()
      return validatedConfig
    } catch (error) {
      if (error instanceof ZodError) {
        // Handle Zod validation errors
        const errorMessages = error.issues
          .map((err: ZodIssue) => `${err.path.join('.')}: ${err.message}`)
          .join('\n')

        core.setFailed(
          `\x1b[31m❌ Config validation failed:\x1b[0m\n${errorMessages}`
        )
        core.endGroup()
        throw error
      }
      core.endGroup()
      throw error
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(
        `\x1b[31m❌ Failed to load config: ${error.message}\x1b[0m`
      )
      core.endGroup()
    } else {
      core.setFailed('\x1b[31m❌ Unexpected error loading config.\x1b[0m')
      core.endGroup()
    }
    core.endGroup()
    throw error
  }
}
