import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import {
    assertLazyPages,
    exceedsBudget,
    staticFiles,
} from './bundle-metrics.mjs'

const root = new URL('../', import.meta.url)
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'))

try {
    const limits = readJson('bundle-budget.json')
    const manifest = readJson('dist/.vite/manifest.json')
    const entries = Object.keys(manifest).filter((key) => manifest[key].isEntry)
    if (!entries.length) throw new Error('No application entry in manifest')
    const eager = staticFiles(manifest, entries)
    const pages = readdirSync(new URL('src/pages/', root), {
        withFileTypes: true,
    })
        .filter((entry) => entry.isDirectory())
        .map((entry) => `src/pages/${entry.name}/index.ts`)
    assertLazyPages(manifest, pages, eager)

    const sizes = new Map()
    for (const chunk of Object.values(manifest)) {
        if (!chunk.file.endsWith('.js') || sizes.has(chunk.file)) continue
        const content = readFileSync(new URL(`dist/${chunk.file}`, root))
        sizes.set(chunk.file, {
            raw: content.length,
            gzip: gzipSync(content).length,
        })
    }
    const gzipTotal = (files) =>
        [...files].reduce((sum, file) => sum + sizes.get(file).gzip, 0)
    let failed = false
    function check(label, bytes, limit) {
        const over = exceedsBudget(bytes, limit)
        failed ||= over
        console.log(
            `${over ? 'FAIL' : 'PASS'} ${label}: ${(bytes / 1000).toFixed(2)} / ${(limit / 1000).toFixed(2)} kB`,
        )
    }
    check(
        'Entry + static dependencies (gzip)',
        gzipTotal(eager),
        limits.entryGzipBytes,
    )
    for (const page of pages) {
        // Union with entry dependencies: shared chunks are transferred only once.
        check(
            `Cold ${page} (gzip)`,
            gzipTotal(staticFiles(manifest, [...entries, page])),
            limits.coldRouteGzipBytes,
        )
    }
    for (const [file, size] of sizes) {
        check(`Chunk ${file} (raw)`, size.raw, limits.chunkRawBytes)
    }
    if (failed) process.exitCode = 1
} catch (error) {
    console.error(
        `Bundle check failed: ${error.message}. Build first in ${fileURLToPath(root)}.`,
    )
    process.exitCode = 1
}
