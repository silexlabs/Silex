const importing = new Set();
export function importIfNeeded(importName) {
    if (!importing.has(importName) && !customElements.get(importName)) {
        console.info(`Importing ${importName}`);
        importing.add(importName);
        import(`./${importName}.js`)
            .then(() => importing.delete(importName));
    }
}
//# sourceMappingURL=utils.js.map