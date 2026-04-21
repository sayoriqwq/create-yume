import type Handlebars from 'handlebars'
import type { HelperOptions } from 'handlebars'

type HandlebarsInstance = ReturnType<typeof Handlebars.create>

function firstTruthy(args: readonly unknown[]) {
  for (const value of args) {
    if (value)
      return value
  }
  return args.at(-1)
}

export function registerTemplateHelpers(hb: HandlebarsInstance) {
  hb.registerHelper('eq', (left: unknown, right: unknown) => left === right)

  hb.registerHelper('or', (...args: unknown[]) => {
    const values = args.slice(0, -1)
    return firstTruthy(values)
  })

  hb.registerHelper('withHash', function withHash(this: unknown, options: HelperOptions) {
    const scope = typeof this === 'object' && this !== null ? this : {}
    return options.fn({ ...scope, ...options.hash })
  })
}
