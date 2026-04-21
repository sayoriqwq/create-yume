import Handlebars from 'handlebars'
import { describe, expect, it } from 'vitest'
import { registerTemplateHelpers } from './template-helpers'

function createRuntime(config: Record<string, unknown>) {
  const hb = Handlebars.create()
  registerTemplateHelpers(hb)
  return {
    hb,
    runtimeOptions: {
      allowProtoMethodsByDefault: false,
      allowProtoPropertiesByDefault: false,
      data: { config },
    } satisfies Handlebars.RuntimeOptions,
  }
}

describe('registerTemplateHelpers', () => {
  it('preserves router branching semantics with eq and or', () => {
    const { hb, runtimeOptions } = createRuntime({
      language: 'typescript',
      router: 'tanstack-router',
    })

    const template = hb.compile(
      `{{#if (or (eq @config.router 'react-router') (eq @config.router 'tanstack-router'))}}router{{else}}app{{/if}}:{{#if (eq @config.language 'typescript')}}ts{{else}}js{{/if}}`,
    )

    expect(template({}, runtimeOptions)).toBe('router:ts')
  })

  it('exposes derived values without hiding parent data or @config via withHash', () => {
    const { hb, runtimeOptions } = createRuntime({
      router: 'react-router',
      language: 'typescript',
    })

    const template = hb.compile(
      `{{#withHash hasRouter=(or (eq @config.router 'react-router') (eq @config.router 'tanstack-router')) alias=name}}{{#if hasRouter}}{{alias}}:{{name}}:{{@config.language}}{{/if}}{{/withHash}}`,
    )

    expect(template({ name: 'app' }, runtimeOptions)).toBe('app:app:typescript')
  })

  it('returns the first truthy operand for nested helper composition', () => {
    const { hb } = createRuntime({})
    const template = hb.compile(`{{or "" 0 value fallback}}`)

    expect(template({ value: 'selected', fallback: 'unused' })).toBe('selected')
  })
})
