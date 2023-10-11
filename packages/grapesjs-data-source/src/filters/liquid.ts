import { Filter } from "../types"

export const filters: Filter[] = [
  // liquidjs filters
  {
    type: 'filter',
    id: 'abs',
    name: 'abs',
    validate: type => !!type && (type.id === 'Int' || type.id === 'Float') && type.kind === 'scalar',
    outputType: type => type,
    apply: num => Math.abs(num as number),
    options: {},
    optionsForm: null,
  }, {
    type: 'filter',
    id: 'strip_html',
    name: 'strip_html',
    validate: type => !!type && type.id === 'String' && type.kind === 'scalar',
    outputType: type => type,
    apply: (str) => (str as string).replace(/<[^>]*>/g, ''),
    options: {},
    optionsForm: null,
  }, {
    type: 'filter',
    id: 'where',
    name: 'where',
    validate: type => !!type && type.kind === 'list',
    outputType: type => type,
    apply: (arr, options) => {
      const { key, value } = options as { key: string, value: string }
      return (arr as Record<string, unknown>[]).filter(item => item[key] === value)
    },
    options: {
      key: '',
      value: '',
    },
    optionsForm: `
      <form>
        <input type="text" name="key" placeholder="Key"/>
        <input type="text" name="value" placeholder="Value"/>
        <button type="submit">Done</button>
      </form>
    `,
  }, {
    type: 'filter',
    id: 'first',
    name: 'first',
    validate: type => !!type && type.kind === 'list',
    outputType: type => type ? {
      ...type,
      kind: type.fields.length ? 'object' : 'scalar',
    } : null,
    apply: (arr) => (arr as unknown[])[0],
    options: {},
    optionsForm: null,
  }, {
    type: 'filter',
    id: 'last',
    name: 'last',
    validate: type => !!type && type.kind === 'list',
    outputType: type => type ? {
      ...type,
      kind: type.fields.length ? 'object' : 'scalar',
    } : null,
    apply: (arr) => (arr as unknown[])[(arr as unknown[]).length - 1],
    options: {},
    optionsForm: null,
  }
]