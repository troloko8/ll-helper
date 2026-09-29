import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
    assertLazyPages,
    exceedsBudget,
    staticFiles,
} from './bundle-metrics.mjs'

const manifest = {
    entry: { file: 'entry.js', imports: ['shared'], dynamicImports: ['page'] },
    shared: { file: 'shared.js', imports: ['nested'] },
    nested: { file: 'nested.js', imports: ['shared'] },
    page: {
        file: 'page.js',
        isDynamicEntry: true,
        imports: ['shared', 'alias'],
    },
    alias: { file: 'shared.js' },
}

test('entry follows transitive static imports, handles cycles, excludes dynamic imports', () => {
    assert.deepEqual(
        [...staticFiles(manifest, ['entry'])],
        ['entry.js', 'shared.js', 'nested.js'],
    )
})
test('cold route deduplicates files across entry, page and manifest aliases', () => {
    assert.deepEqual(
        [...staticFiles(manifest, ['entry', 'page'])],
        ['entry.js', 'shared.js', 'nested.js', 'page.js'],
    )
})
test('missing imports fail instead of undercounting', () => {
    assert.throws(
        () => staticFiles(manifest, ['missing']),
        /Missing manifest entry/,
    )
})
test('page guard catches missing or eagerly imported boundaries', () => {
    assertLazyPages(manifest, ['page'], staticFiles(manifest, ['entry']))
    assert.throws(() => assertLazyPages(manifest, [], new Set()), /No page/)
    assert.throws(
        () => assertLazyPages(manifest, ['missing'], new Set()),
        /lazy boundary/,
    )
    assert.throws(
        () => assertLazyPages(manifest, ['page'], new Set(['page.js'])),
        /lazy boundary/,
    )
    assert.throws(
        () => assertLazyPages(manifest, ['entry'], new Set()),
        /lazy boundary/,
    )
})
test('budget boundary is inclusive; invalid limits fail closed', () => {
    assert.equal(exceedsBudget(100, 100), false)
    assert.equal(exceedsBudget(101, 100), true)
    for (const limit of [undefined, 0, -1, '100']) {
        assert.throws(() => exceedsBudget(1, limit), /Invalid bundle limit/)
    }
})
