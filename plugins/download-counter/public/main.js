{ // this wrapper avoids name clashing of outer variables and functions
    const config = HFS.getPluginConfig()

    const label = HFS.t(["Download counter", "download counter"])
    const inMenu = config.where === 'menu'
    HFS.onEvent('additionalEntryDetails', ({ entry: { hits } }) =>
        hits && !inMenu && `<span class="download-counter" title="${label}">${hits}</span>`)

    HFS.onEvent('fileMenu', ({ entry, props }) => {
        if (inMenu && !entry.isFolder)
            props.push([label, entry.hits || 0])
    })
}