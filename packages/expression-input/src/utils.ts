const importing = new Set<string>()
export function importIfNeeded(importName: string) {
  if(!importing.has(importName) && !customElements.get(importName)) {
    console.info(`Importing ${importName}`)
    importing.add(importName)
    import(`./${importName}.js`)
    .then(() => importing.delete(importName))
  }
}
