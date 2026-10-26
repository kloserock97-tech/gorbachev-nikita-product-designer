// use_figma: убрать за собой — временную страницу выгрузки и все ключи f2h в sharedPluginData. Файл Figma остаётся как был.
const page = figma.root.children.find((p) => p.name === "zz-tmp-export (удалить)");
if (page) { if (figma.currentPage === page) await figma.setCurrentPageAsync(figma.root.children[0]); page.remove(); }
const keys = figma.root.getSharedPluginDataKeys("f2h");
for (const k of keys) figma.root.setSharedPluginData("f2h", k, "");
return { removedPage: !!page, clearedKeys: keys.length };
