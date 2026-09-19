const assert = require('assert')
const { pathToFileURL } = require('url')
const path = require('path')

async function load() {
    return import(pathToFileURL(path.join(__dirname, '../src/font-family.js')).href)
}

function test(name, fn) {
    return fn().then(() => {
        console.log(`  PASS  ${name}`)
        return true
    }).catch(err => {
        console.error(`  FAIL  ${name}`)
        console.error(`        ${err.message}`)
        return false
    })
}

async function main() {
    const { sameFontFamily, findFontIndex, formatFontList, removeInstalledFont } = await load()
    let passed = 0
    let total = 0

    async function run(name, fn) {
        total++
        if (await test(name, async () => fn())) passed++
    }

    console.log('grapesjs-fonts font-family unit tests\n')

    await run('sameFontFamily is case-insensitive', () => {
        assert.strictEqual(sameFontFamily('Roboto', 'roboto'), true)
        assert.strictEqual(sameFontFamily('Open Sans', 'OPEN SANS'), true)
        assert.strictEqual(sameFontFamily('Roboto', 'Open Sans'), false)
    })

    await run('findFontIndex matches installed Roboto with roboto', () => {
        const fonts = [{ family: 'Roboto' }, { family: 'Open Sans' }]
        assert.strictEqual(findFontIndex(fonts, 'roboto'), 0)
        assert.strictEqual(findFontIndex(fonts, 'OPEN SANS'), 1)
        assert.strictEqual(findFontIndex(fonts, 'Inter'), -1)
    })

    await run('removeInstalledFont removes wrong-case family', () => {
        const fonts = [{ family: 'Roboto', category: 'sans-serif', variants: ['regular'] }]
        const { fonts: next, removed } = removeInstalledFont(fonts, 'roboto')
        assert.strictEqual(removed.family, 'Roboto')
        assert.deepStrictEqual(next, [])
    })

    await run('removeInstalledFont rejects a missing family and lists installed fonts', () => {
        const fonts = [{ family: 'Roboto' }, { family: 'Inter' }]
        assert.throws(
            () => removeInstalledFont(fonts, 'Comic Sans'),
            /Font "Comic Sans" not installed\. Installed fonts: Roboto, Inter/
        )
    })

    await run('removeInstalledFont lists (none) when nothing is installed', () => {
        assert.throws(
            () => removeInstalledFont([], 'Roboto'),
            /Installed fonts: \(none\)/
        )
        assert.strictEqual(formatFontList([]), '(none)')
    })

    console.log(`\n${passed}/${total} passed, ${total - passed} failed`)
    process.exit(passed === total ? 0 : 1)
}

main()
