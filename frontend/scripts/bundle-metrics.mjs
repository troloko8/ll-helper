// Follow static imports only: dynamic imports are requested by a later boundary.
export function staticFiles(manifest, roots) {
    const visited = new Set()
    const files = new Set()

    function visit(key) {
        if (visited.has(key)) return
        const chunk = manifest[key]
        if (!chunk) throw new Error(`Missing manifest entry: ${key}`)
        visited.add(key)
        if (chunk.file.endsWith('.js')) files.add(chunk.file)
        for (const dependency of chunk.imports ?? []) visit(dependency)
    }

    for (const root of roots) visit(root)
    return files
}

export function assertLazyPages(manifest, pages, eagerFiles) {
    if (!pages.length) throw new Error('No page boundaries found')
    for (const page of pages) {
        if (
            !manifest[page]?.isDynamicEntry ||
            eagerFiles.has(manifest[page].file)
        ) {
            throw new Error(`Page must remain a lazy boundary: ${page}`)
        }
    }
}

export function exceedsBudget(bytes, limit) {
    if (!Number.isFinite(limit) || limit <= 0)
        throw new Error('Invalid bundle limit')
    return bytes > limit
}
