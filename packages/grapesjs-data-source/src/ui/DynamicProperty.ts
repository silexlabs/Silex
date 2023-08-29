import { html } from 'lit-html'
import { Component } from 'grapesjs'
import {basicSetup, EditorView, minimalSetup} from "codemirror"
import {autocompletion, CompletionContext, CompletionResult, startCompletion} from "@codemirror/autocomplete"
import { EditorState } from '@codemirror/state'
import { Type } from '..'

type PropertyType = 'string' | 'expression' | 'array' | 'object'

export class DynamicProperty<DataType = any> {
  public name: string
  public displayName: string
  public type: PropertyType
  public onChange: ((value: DataType) => void) | undefined
  //public isAvailable: (component: Component) => boolean
  //public getValue: (component: Component) => any
  //public setValue: (component: Component, value: any) => void
  constructor(def: {
    name: string,
    displayName: string,
    type: PropertyType
    subtype?: 'string' | 'expression',
    //isAvailable: (component: Component) => boolean,
    //getValue: (component: Component) => any,
    //setValue: (component: Component, value: any) => void,
  }) {
    this.name = def.name
    this.displayName = def.displayName
    this.type = def.type
    //this.isAvailable = def.isAvailable
    //this.getValue = def.getValue
    //this.setValue = def.setValue
  }

  autoComplete(context: CompletionContext, completions: Record<string, Type>): CompletionResult | null {
    //const before = context.matchBefore(/\w+/)
    // Match the last word with "." as a separator
    const before = context.matchBefore(/[\w\.]+/)
    if (before?.text.includes('.')) {
      const lastType = before?.text.split('.')
        // Remove the last variable, as it's the one being completed
        .slice(0, -1)
        // Get the current type
        .reduce((current: Type | null, name: string) => {
          if(current && current.kind === 'LIST') {
            console.warn('LIST not implemented', current.ofType)
            throw new Error('LIST not implemented')
          } else if (current && current.kind === 'OBJECT') {
            const type: Type | undefined = current ? current.fields.find(f => f.name === name)?.type : completions[name]
            if (!type) return null
            return completions[type.name]
          } else {
            console.warn('type is not LIST or OBJECT', current)
            throw new Error('Not implementd: type is not LIST or OBJECT')
          }
        }, null)
      const options = lastType ? lastType.fields.map(field => ({
        label: field.name,
        type: field.type.kind === 'SCALAR' ? 'variable' : 'property',
      })) : []
      console.log('options', options, lastType, lastType?.fields)
      const indexOfLastDot = before?.text?.lastIndexOf('.')
      const from = indexOfLastDot && indexOfLastDot > 0 ? indexOfLastDot + 1 : 0
      return {
        from,
        options,
        //validFor: /^\w*$/
      }
    } else {
      return {
        from: before?.from ?? context.pos,
        options: Object.values(completions).map((type: Type) => ({
          label: type.name,
          type: type.kind === 'SCALAR' ? 'variable' : 'property',
          //validFor: /.*\.$/,
        })),
      }
    }
  }

  showCompletion(view: EditorView) {
    setTimeout(() => {
      startCompletion(view)
    }, 0)
  }

  toHtmlForm(dsData: DataType | undefined, completions: any): ReturnType<typeof html> {
    switch(this.type) {
      case 'string': {
        return html`
          <label class="ds-container">
            <div class="ds-label">${this.displayName}</div>
            <div class="ds-field gjs-field gjs-field-text">
              <input type="text" value="${dsData}" @keyup=${(e: Event) => {
                this.onChange?.((e.target as HTMLInputElement).value as DataType)
              }} />
            </div>
          </label>
        `
      }
      case 'expression': {
        const dsDataArray = (dsData ?? []) as Type[]
        const view: EditorView = new EditorView({
          doc: dsDataArray.map((type: Type) => `${type.name}`).join('.'),
          extensions: [
            //basicSetup,
            minimalSetup,
            // 1 line only
            EditorState.transactionFilter.of(tr => tr.newDoc.lines > 1 ? [] : [tr]),
            autocompletion({ override: [(context: CompletionContext) => this.autoComplete(context, completions)] }),
            EditorView.domEventHandlers({
              focus: () => this.showCompletion(view),
              keyup: () => this.showCompletion(view),
            }),
          ],
          parent: document.body
        })
        return html`
          <label class="ds-container">
            <div class="ds-label">${this.displayName}</div>
            <div class="ds-field gjs-field gjs-field-text">
              ${view.dom}
            </div>
          </label>
        `
      }
      case 'array': {
        const dsDataArray = (dsData ?? []) as any[]
        return html`
          <div class="ds-container">
            <button class="ds-add ds-button" @keyup=${(e: Event) => {
              this.onChange?.(dsDataArray.concat('') as DataType)
            }}>
            +
            </button>
            <div class="ds-label">${this.displayName}</div>
            ${dsDataArray.map((value: any, index: number) => html`
              <div class="ds-field gjs-field gjs-field-text" data-key=${index}>
                <input type="text" value="${value}" />
                <button class="ds-up ds-button" @click=${(e: Event) => {
                  const moving = dsDataArray.splice(index, 1)[0]
                  dsDataArray.splice(index - 1, 0, moving)
                  this.onChange?.(dsDataArray as DataType)
                }}>^</button>
                <button class="ds-down ds-button" @click=${(e: Event) => {
                  const moving = dsDataArray.splice(index, 1)[0]
                  dsDataArray.splice(index + 1, 0, moving)
                  this.onChange?.(dsDataArray as DataType)
                }}>v</button>
                <button class="ds-remove ds-button" @click=${(e: Event) => {
                  const newData = [...dsDataArray]
                  newData.splice(index, 1)
                  this.onChange?.(newData as DataType)
                }}>x</button>
              </div>
            `)}
          </div>
        `
      }
      default:
        throw new Error(`Unknown property type ${this.type}`)
    }
  }
}
