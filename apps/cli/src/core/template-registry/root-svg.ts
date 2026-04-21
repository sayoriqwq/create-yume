import type { TemplatePath } from '@/brand/template-path'
import type { ComposeDSL } from '@/types/dsl'
import * as path from 'node:path'
import { makeTemplatePath } from '@/brand/template-path'

export function buildRootSvg(dsl: ComposeDSL, templateRoot: TemplatePath) {
  const src = makeTemplatePath(path.join(templateRoot, 'assets', 'moon-star.svg'))
  dsl.copy(src, 'public/moon-star.svg')
}
