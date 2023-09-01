import { html } from 'lit-html'
import { Component } from 'grapesjs'
//import {basicSetup, EditorView, minimalSetup} from "codemirror"
//import {autocompletion, CompletionContext, CompletionResult, startCompletion} from "@codemirror/autocomplete"
//import { EditorState } from '@codemirror/state'
import { Field, Type } from '..'

const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']

export class DynamicProperty {
  public name: string
  public displayName: string
  public onChange: ((value: Field[]) => void) | undefined
  //public isAvailable: (component: Component) => boolean
  //public getValue: (component: Component) => any
  //public setValue: (component: Component, value: any) => void
  constructor(def: {
    name: string,
    displayName: string,
    //isAvailable: (component: Component) => boolean,
    //getValue: (component: Component) => any,
    //setValue: (component: Component, value: any) => void,
  }) {
    this.name = def.name
    this.displayName = def.displayName
    //this.isAvailable = def.isAvailable
    //this.getValue = def.getValue
    //this.setValue = def.setValue
  }

  // autoComplete(context: CompletionContext, completions: Record<string, Type>): CompletionResult | null {
  //   //const before = context.matchBefore(/\w+/)
  //   // Match the last word with "." as a separator
  //   const before = context.matchBefore(/[\w\.]+/)
  //   if (before?.text.includes('.')) {
  //     const lastType = before?.text.split('.')
  //       // Remove the last variable, as it's the one being completed
  //       .slice(0, -1)
  //       // Get the current type
  //       .reduce((current: Type | null, name: string) => {
  //         if(current?.kind === 'LIST') {
  //           console.warn('LIST not implemented', current.ofType)
  //           throw new Error('LIST not implemented')
  //         } else if (current?.kind === 'OBJECT' || current?.fields) {
  //           const type: Type | undefined = current.fields.find(f => f.name === name)?.type
  //           if (!type) {
  //             console.warn('type not found', current, name)
  //             return null
  //           }
  //           return completions[type.name]
  //         } else if (current) {
  //           console.warn('type is not LIST or OBJECT', current)
  //           throw new Error('Not implementd: type is not LIST or OBJECT')
  //         } else {
  //           return completions[name]
  //         }
  //       }, null)
  //     const options = lastType?.fields?.map(field => ({
  //       label: field.name,
  //       type: field.type.kind === 'SCALAR' ? 'variable' : 'property',
  //     })) ?? []
  //     const indexOfLastDot = before?.text?.lastIndexOf('.')
  //     const from = indexOfLastDot && indexOfLastDot > 0 ? indexOfLastDot + 1 : 0
  //     return {
  //       from,
  //       options,
  //       //validFor: /^\w*$/
  //     }
  //   } else {
  //     return {
  //       from: before?.from ?? context.pos,
  //       options: Object.values(completions).map((type: Type) => ({
  //         label: type.name,
  //         type: type.kind === 'SCALAR' ? 'variable' : 'property',
  //         //validFor: /.*\.$/,
  //       })),
  //     }
  //   }
  // }

  // showCompletion(view: EditorView) {
  //   setTimeout(() => {
  //     startCompletion(view)
  //   }, 0)
  // }

  getCompletion(context: Record<string, Type>, type: Type | undefined): Field[] {
    if(type) {
      const result = context[type.name]?.fields
      return result ?? []
    } else {
      return Object.values(context).map((type: Type) => ({
        name: '',
        type,
      }))
    }
  }

  getFieldDisplayName(field: Field): string {
    switch (field.type.kind) {
      case 'SCALAR':
        return `${field.name} 🔑`
      case 'LIST':
        return `${field.type.ofType?.name} 📜`
      case 'OBJECT':
        return `${field.name} 📦`
      case 'NON_NULL':
        return `${field.name} ❗`
      default:
        // display symbol for collections of the cms
        return `${field.name || field.type.name} 📂`
    }
  }

  getCompletionSelect(currentIndex: number, displayedFields: Field[], context: Record<string, Type>, onChange: (field?: Field) => void): ReturnType<typeof html> {
    const currentField = displayedFields[currentIndex]
    const previousField = displayedFields[currentIndex - 1]
    const completion = this.getCompletion(context, previousField?.type)
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
                // Remove the field
                onChange()
              } else {
                const isType = option.hasAttribute('data-is-type')
                const newField = completion.find(field => isType ? field.type.name === fieldName : field.name === fieldName)
                const newType = newField?.type
                if(!newType) throw new Error('newType is undefined')
                onChange({
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

  toHtmlForm(fields: Field[], context: Record<string, Type>): ReturnType<typeof html> {
    if(!fields) throw new Error('fields is undefined')
    // const view: EditorView = new EditorView({
    //   doc: dsDataArray.map((type: Type) => `${type.name}`).join('.'),
    //   extensions: [
    //     //basicSetup,
    //     minimalSetup,
    //     // 1 line only
    //     EditorState.transactionFilter.of(tr => tr.newDoc.lines > 1 ? [] : [tr]),
    //     autocompletion({ override: [(context: CompletionContext) => this.autoComplete(context, completions)] }),
    //     EditorView.domEventHandlers({
    //       focus: () => this.showCompletion(view),
    //       update: () => this.showCompletion(view),
    //       input: () => console.log('input'),
    //       blur: () => console.log('blur'),
    //     }),
    //   ],
    //   parent: document.body
    // })
    return html`
      <div class="ds-container">
        <div class="ds-label">${this.displayName}</div>
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
            //view.dom
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
