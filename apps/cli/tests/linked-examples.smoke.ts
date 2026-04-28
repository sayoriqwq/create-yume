import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { execa } from 'execa'

interface LinkedSmokeCase {
  readonly label: string
  readonly preset: 'react-full' | 'vue-full'
  readonly projectName: string
  readonly cliArgs: readonly string[]
  readonly installAfterGenerate: boolean
}

const testsDir = path.dirname(fileURLToPath(import.meta.url))
const cliRoot = path.resolve(testsDir, '..')
const repoRoot = path.resolve(cliRoot, '../..')
const generatedRoot = path.join(repoRoot, 'apps/examples/.generated')
const generatedWorkspace = path.join(generatedRoot, 'pnpm-workspace.yaml')
const generatedNpmrc = path.join(generatedRoot, '.npmrc')

const linkedSmokeCases: readonly LinkedSmokeCase[] = [
  {
    label: 'react full preset via linked bin with install and git bootstrap',
    preset: 'react-full',
    projectName: 'react-full-linked',
    cliArgs: ['--install'],
    installAfterGenerate: false,
  },
  {
    label: 'vue full preset via linked bin with install and git bootstrap',
    preset: 'vue-full',
    projectName: 'vue-full-linked',
    cliArgs: ['--install'],
    installAfterGenerate: false,
  },
]

function smokeEnv(extraPath?: string) {
  return {
    ...process.env,
    CI: '1',
    FORCE_COLOR: '0',
    npm_config_frozen_lockfile: 'false',
    ...(extraPath ? { PATH: `${extraPath}${path.delimiter}${process.env.PATH ?? ''}` } : {}),
  }
}

async function run(command: string, args: readonly string[], options: {
  readonly cwd: string
  readonly extraPath?: string
}) {
  await execa(command, args, {
    cwd: options.cwd,
    stdio: 'inherit',
    env: smokeEnv(options.extraPath),
  })
}

async function output(command: string, args: readonly string[], cwd: string) {
  const result = await execa(command, args, {
    cwd,
    env: smokeEnv(),
  })
  return result.stdout.trim()
}

async function prepareGeneratedRoot() {
  await rm(generatedRoot, { recursive: true, force: true })
  await mkdir(generatedRoot, { recursive: true })
  await writeFile(generatedWorkspace, 'packages:\n  - "*"\n', 'utf8')
  await writeFile(generatedNpmrc, 'frozen-lockfile=false\n', 'utf8')
}

async function linkCli() {
  const globalBin = await output('pnpm', ['bin', '--global'], repoRoot)

  await run('pnpm', ['link', '--global'], { cwd: cliRoot })

  return {
    globalBin,
    async unlink() {
      await execa('pnpm', ['remove', '--global', 'create-yume'], {
        cwd: repoRoot,
        stdio: 'inherit',
        env: smokeEnv(globalBin),
        reject: false,
      })
    },
  }
}

async function runLinkedSmokeCase(testCase: LinkedSmokeCase, globalBin: string) {
  const generatedDir = path.join(generatedRoot, testCase.projectName)
  console.log(`\n[linked-smoke] generating ${testCase.label}`)

  await run(
    'create-yume',
    [
      '--pre',
      testCase.preset,
      '--name',
      testCase.projectName,
      ...testCase.cliArgs,
    ],
    {
      cwd: generatedRoot,
      extraPath: globalBin,
    },
  )

  if (testCase.installAfterGenerate) {
    console.log(`[linked-smoke] installing dependencies for ${testCase.label}`)
    await run('pnpm', ['install', '--ignore-scripts'], {
      cwd: generatedDir,
      extraPath: globalBin,
    })
  }

  console.log(`[linked-smoke] building generated ${testCase.label}`)
  await run('pnpm', ['build'], {
    cwd: generatedDir,
    extraPath: globalBin,
  })
}

async function main() {
  await prepareGeneratedRoot()

  const link = await linkCli()
  try {
    for (const testCase of linkedSmokeCases) {
      await runLinkedSmokeCase(testCase, link.globalBin)
    }
    console.log(`\n[linked-smoke] all linked example checks passed in ${generatedRoot}`)
  }
  finally {
    await link.unlink()
  }
}

await main()
