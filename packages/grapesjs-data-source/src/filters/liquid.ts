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
  }, {
    type: 'filter',
    id: 'join',
    name: 'join',
    validate: type => !!type && type.kind === 'list' && type.id === 'String',
    outputType: type => type ? {
      ...type,
      kind: 'scalar',
    } : null,
    apply: (arr, options) => (arr as string[]).join(options.separator as string ?? ','),
    options: {
      separator: ',',
    },
    optionsForm: `
      <form>
        <label>Separator
          <input type="text" name="separator" placeholder="Separator"/>
        </label>
        <button type="submit">Done</button>
      </form>
    `,
  }, {
    type: 'filter',
    id: 'split',
    name: 'split',
    validate: type => !!type && type.kind === 'scalar' && type.id === 'String',
    outputType: type => type ? {
      ...type,
      kind: 'list',
    } : null,
    apply: (str, options) => (str as string).split(options.separator as string ?? ','),
    options: {
      separator: ',',
    },
    optionsForm: `
      <form>
        <label>Separator
          <input type="text" name="separator" placeholder="Separator"/>
        </label>
        <button type="submit">Done</button>
      </form>
    `,
  }, {
    type: 'filter',
    id: 'map',
    name: 'map',
    validate: type => !!type && type.kind === 'list',
    outputType: type => type,
    apply: (arr, options) => (arr as Record<string, unknown>[]).map(item => item[options.key as string]),
    options: {
      key: '',
    },
    optionsForm: `
      <form>
        <label>Key
          <input type="text" name="key" placeholder="Key"/>
        </label>
        <button type="submit">Done</button>
      </form>
    `,
  }, {
    type: 'filter',
    id: 'reverse',
    name: 'reverse',
    validate: type => !!type && type.kind === 'list',
    outputType: type => type,
    apply: (arr) => (arr as unknown[]).reverse(),
    options: {},
    optionsForm: null,
  }, {
    type: 'filter',
    id: 'size',
    name: 'size',
    validate: type => !!type && type.kind === 'list',
    outputType: () => 'Int',
    apply: (arr) => (arr as unknown[]).length,
    options: {},
    optionsForm: null,
  }, {
    type: 'filter',
    id: 'at',
    name: 'at',
    validate: type => !!type && type.kind === 'list',
    outputType: type => type ? {
      ...type,
      kind: type.fields.length ? 'object' : 'scalar',
    } : null,
    apply: (arr, options) => (arr as unknown[])[options.index as number],
    options: {
      index: 0,
    },
    optionsForm: `
      <form>
        <label>Index
          <input type="number" name="index" placeholder="Index"/>
        </label>
        <button type="submit">Done</button>
      </form>
    `,
  }
]