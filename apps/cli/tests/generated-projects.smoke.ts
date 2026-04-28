import assert from 'node:assert/strict'
import { access, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execa } from 'execa'

interface SmokeCase {
  readonly label: string
  readonly preset: 'react-minimal' | 'react-full' | 'vue-minimal' | 'vue-full'
  readonly projectName: string
}

const testsDir = path.dirname(fileURLToPath(import.meta.url))
const cliDistPath = path.resolve(testsDir, '../dist/index.js')

const smokeCases: readonly SmokeCase[] = [
  {
    label: 'react minimal preset',
    preset: 'react-minimal',
    projectName: 'smoke-react-minimal',
  },
  {
    label: 'react full preset',
    preset: 'react-full',
    projectName: 'smoke-react-full',
  },
  {
    label: 'vue minimal preset',
    preset: 'vue-minimal',
    projectName: 'smoke-vue-minimal',
  },
  {
    label: 'vue full preset',
    preset: 'vue-full',
    projectName: 'smoke-vue-full',
  },
]

async function runSmokeCase(rootDir: string, testCase: SmokeCase) {
  const generatedDir = path.join(rootDir, testCase.projectName)
  console.log(`\n[smoke] generating ${testCase.label} in ${generatedDir}`)

  const generation = await execa(
    'node',
    [
      cliDistPath,
      '--preset',
      testCase.preset,
      '--name',
      testCase.projectName,
      '--no-install',
      '--no-git',
    ],
    {
      cwd: rootDir,
      env: {
        CI: '1',
        FORCE_COLOR: '0',
      },
    },
  )

  assert.ok(!generation.stdout.includes('?'), 'non-interactive smoke should not print prompt questions')

  console.log(`[smoke] installing dependencies for ${testCase.label}`)
  await execa('pnpm', ['install', '--ignore-scripts'], {
    cwd: generatedDir,
    stdio: 'inherit',
    env: {
      CI: '1',
      FORCE_COLOR: '0',
    },
  })

  console.log(`[smoke] building generated ${testCase.label} project`)
  await execa('pnpm', ['build'], {
    cwd: generatedDir,
    stdio: 'inherit',
    env: {
      CI: '1',
      FORCE_COLOR: '0',
    },
  })
}

async function main() {
  await access(cliDistPath)

  const rootDir = await mkdtemp(path.join(tmpdir(), 'create-yume-smoke-'))

  try {
    for (const testCase of smokeCases) {
      await runSmokeCase(rootDir, testCase)
    }
    console.log(`\n[smoke] all generated project checks passed in ${rootDir}`)
  }
  finally {
    await rm(rootDir, { recursive: true, force: true })
  }
}

await main()
