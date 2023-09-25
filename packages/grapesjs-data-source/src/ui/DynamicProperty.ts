import { html } from 'lit'
import { Context, Field, Schema, Type } from '..'

export interface DynamicPropertyOptions {
  name: string
  displayName: string
  scalarIcon?: string
  listIcon?: string
  objectIcon?: string
  nonNullIcon?: string
  collectionIcon?: string
}

export class DynamicProperty {
  protected options: DynamicPropertyOptions
  public onChange: ((value: Field[]) => void) | undefined
  constructor(opts: Partial<DynamicPropertyOptions>) {
    this.options = {
      scalarIcon: '🔑',
      listIcon: '📜',
      objectIcon: '📦',
      nonNullIcon: '❗',
      collectionIcon: '📂',
      ...opts,
    } as DynamicPropertyOptions
    // Check that the name and displayName are set
    if(!this.options.name) throw new Error('name is undefined')
    if(!this.options.displayName) throw new Error('displayName is undefined')
  }

  getCompletion(context: Context, dataSourceName: string | undefined, type: Type | undefined): Field[] {
      console.log('context', context, 'type', type)
    if(type && dataSourceName) {
      const result = context[dataSourceName]?.types.find(field => field.name === type.name)?.fields
      //const result = context[type.name]?.fields
      console.log('result', result)
      return result ?? []
    } else {
      const result = Object.values(context).map((schema: Schema) => schema.types.map((type: Type) => ({
        name: type.name,
        type: {
          name: type.name,
          kind: type.kind,
          ofType: type.ofType,
        },
      } as Field))).flat()
      console.log('result', result)
      return result
    }
  }

  getName(): string {
    return this.options.name
  }

  getFieldDisplayName(field: Field): string {
    switch (field.type.kind) {
      case 'SCALAR':
        return `${this.options.scalarIcon} ${field.name}`
      case 'LIST':
        return `${this.options.listIcon} ${field.type.ofType?.name}`
      case 'OBJECT':
        return `${this.options.objectIcon} ${field.name}`
      case 'NON_NULL':
        return `${this.options.nonNullIcon} ${field.name}`
      default:
        // display symbol for collections of the cms
        return `${this.options.collectionIcon} ${field.name || field.type.name}`
    }
  }

  getCompletionSelect(currentIndex: number, displayedFields: Field[], context: Context, changeCallback: (field?: Field) => void): ReturnType<typeof html> {
    const dataSourceName = displayedFields[0]?.type.name
    const currentField = displayedFields[currentIndex]
    const previousField = displayedFields[currentIndex - 1]
    console.log('DATA SOURCE', dataSourceName)
    const completion = this.getCompletion(context, dataSourceName, previousField?.type)
    if(completion.length === 0) return html``
    return html`
      <label class="ds-select__wrapper">
        <div class="ds-select__name gjs-field gjs-field-text gjs-label ${currentIndex === displayedFields.length ? 'last' : ''}">
          ${currentField && this.getFieldDisplayName(currentField)}
          <select
            class="ds-select"
            @change=${(e: Event) => {
              const select = e.target as HTMLSelectElement
              const option = select.options[select.selectedIndex]
              const fieldName = select.value
              if (fieldName === '') {
                changeCallback()
              } else {
                const isType = option.hasAttribute('data-is-type')
                const newField = completion.find(field => isType ? field.type.name === fieldName : field.name === fieldName)
                const newType = newField?.type
                if(!newType) throw new Error('newType is undefined')
                changeCallback({
                  name: fieldName,
                  type: newType,
                })
              }
            }}
            >
            <option value="">-</option>
            ${
              completion
              .map((field: Field) => html`
                <option
                  value="${field.name === '' ? field.type.name : field.name}"
                  ?data-is-type=${field.name === ''}
                  ?selected=${field.name === '' ? field.type.name === currentField?.type.name : field.name === currentField?.name}
                  >
                  ${ this.getFieldDisplayName(field) }
                </option>
              `)
            }
          </select>
        </div>
        <div class="ds-select__type gjs-four-color">${currentField?.type.name ?? currentField?.type.ofType?.name}</div>
      </label>
    `
  }

  toHtmlForm(fields: Field[], context: Context): ReturnType<typeof html> {
    if(!fields) throw new Error('fields is undefined')
    return html`
      <div class="ds-container">
        <div class="ds-label">${this.options.displayName}</div>
        <div class="ds-field">
          ${
            fields.map((field: Field, index: number) => html`
              ${
                this.getCompletionSelect(index, fields, context, (field?: Field) => {
                  if(field) {
                    // Remove all types until the current one
                    // And replace the current one
                    this.onChange?.(fields.slice(0, index).concat(field) as Field[])
                  } else {
                    // Remove the current field
                    this.onChange?.(fields.slice(0, index) as Field[])
                  }
                })
              }
            `)
          }
          ${
            this.getCompletionSelect(fields.length, fields, context, (field?: Field) => {
              if(field) {
                this.onChange?.(fields.concat(field) as Field[])
              }
            })
          }
        </div>
      </div>
    `
  }
}
