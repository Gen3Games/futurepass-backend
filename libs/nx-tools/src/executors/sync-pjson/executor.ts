/* eslint-disable @typescript-eslint/require-await -- this is used for dev only */
/* eslint-disable @typescript-eslint/no-unsafe-call -- this is used for dev only */
/* eslint-disable no-console -- this is used for dev only */
/* eslint-disable @typescript-eslint/no-non-null-assertion -- this is used for dev only */
/* eslint-disable @typescript-eslint/no-dynamic-delete -- this is used for dev only */
/* eslint-disable @typescript-eslint/consistent-type-assertions -- this is used for dev only */

import {
  ExecutorContext,
  getOutputsForTargetAndConfiguration,
  readJsonFile,
  writeJsonFile,
} from '@nx/devkit'
import { calculateProjectDependencies } from '@nx/js/src/utils/buildable-libs-utils'
import { Minimatch } from 'minimatch'
import { BuildExecutorSchema } from './schema'

function die(msg: string): never {
  throw new Error(`invariant violation: ${msg}`)
}

type PackageJSON = {
  dependencies?: { [k: string]: string }
  devDependencies?: { [k: string]: string }
  peerDependencies?: { [k: string]: string }
}

type Section = 'dependencies' | 'devDependencies' | 'peerDependencies'

export default async function runExecutor(
  options: BuildExecutorSchema,
  context: ExecutorContext
) {
  const root = context.root
  const projectName = context.projectName ?? die('$.projectName')
  // const workspace = context.workspace ?? die('$.workspace');
  const projectGraph = context.projectGraph ?? die('$.projectGraph')
  const targetName = context.targetName ?? die('$.targetName')
  const configurationName = context.configurationName ?? 'production'

  const { target } = calculateProjectDependencies(
    projectGraph,
    root,
    projectName,
    targetName,
    configurationName,
    true
  )
  const outputs = getOutputsForTargetAndConfiguration(
    {
      // id: '',
      overrides: {},
      target: {
        project: projectName,
        target: targetName,
        configuration: configurationName,
      },
      // outputs: [],
    },
    target
  )

  const outputDir = outputs[0] ?? die('no outputs')

  // load up relevant package.json files
  const rootPjson = readJsonFile<PackageJSON>(`${root}/package.json`)
  const pkgPjson = readJsonFile<PackageJSON>(`${outputDir}/package.json`)

  // update the workspace package.json file based on discovered dependencies
  // (via source analysis) using the root package.json as the source of truth
  // for versions (the auto-discovered versions are per lock file; so no semver
  // ranges.)
  const deps: [string, string, Section][] = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
  ].flatMap((section) => {
    return Object.entries(
      pkgPjson[
        section as 'dependencies' | 'devDependencies' | 'peerDependencies'
      ] ?? {}
    ).map(([k, v]) => [k, v, section] as [string, string, Section])
  })

  pkgPjson.dependencies = {}
  pkgPjson.devDependencies = {}
  pkgPjson.peerDependencies = {}

  for (const [name, currentVersion, currentSection] of deps) {
    let targetSection: 'dependencies' | 'devDependencies' | 'peerDependencies' =
      'dependencies'

    // project-internal packages
    // TODO for project-internal packages another tool would be good that
    //      ensures there are no unpublished local changes we depend on.
    if (name.startsWith('@futureverse/')) {
      // see above why pkgPjson.depenencies is presumed to be defined here
      pkgPjson['dependencies']![name] = currentVersion
      continue
    }

    // check for a section overrides
    for (const pattern of options.dependencies ?? []) {
      if (new Minimatch(pattern).match(name) === true) {
        targetSection = 'dependencies'
      }
    }

    for (const pattern of options.peerDependencies ?? []) {
      if (new Minimatch(pattern).match(name) === true) {
        targetSection = 'peerDependencies'
      }
    }

    // place the deps in the correct section based on where they are in the root package.json
    const depVersion = rootPjson.dependencies?.[name]
    const devDepVersion = rootPjson.devDependencies?.[name]
    const peerDepVersion = rootPjson.peerDependencies?.[name]

    if (depVersion) {
      const cur = pkgPjson[currentSection]
      if (cur) delete cur[name]
      pkgPjson[targetSection]![name] = depVersion
    } else if (devDepVersion) {
      const cur = pkgPjson[currentSection]
      if (cur) delete cur[name]
      pkgPjson[targetSection]![name] = devDepVersion
    } else if (peerDepVersion) {
      const cur = pkgPjson[currentSection]
      if (cur) delete cur[name]
      pkgPjson[targetSection]![name] = peerDepVersion
    } else {
      console.warn(
        `[warn] discovered dependency that is not in root package.json; name=${name}`
      )
    }
  }

  writeJsonFile(`${outputDir}/package.json`, pkgPjson)

  return {
    success: true,
  }
}

/* eslint-enable @typescript-eslint/require-await -- this is used for dev only */
/* eslint-enable @typescript-eslint/no-unsafe-call -- this is used for dev only */
/* eslint-enable no-console -- this is used for dev only */
/* eslint-enable @typescript-eslint/no-non-null-assertion -- this is used for dev only */
/* eslint-enable @typescript-eslint/no-dynamic-delete -- this is used for dev only */
/* eslint-enable @typescript-eslint/consistent-type-assertions -- this is used for dev only */
