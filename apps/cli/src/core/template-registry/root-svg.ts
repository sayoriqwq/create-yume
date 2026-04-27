import type { TemplatePath } from '@/brand/template-path'
import type { ComposeDSL } from '@/core/services/planner'
import * as path from 'node:path'
import { makeTemplatePath } from '@/brand/template-path'
import { contributionTrace, ContributionUnitKind, FrontendScaffoldOwner } from '@/core/ownership/model'

export function buildRootSvg(dsl: ComposeDSL, templateRoot: TemplatePath) {
  const src = makeTemplatePath(path.join(templateRoot, 'assets', 'moon-star.svg'))
  dsl.copy(src, 'public/moon-star.svg', contributionTrace(FrontendScaffoldOwner, ContributionUnitKind.StaticAssetCopy))
}
