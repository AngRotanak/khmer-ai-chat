
import type { BlockMap, SharedTemplateMap, Template } from "~/modules/nodes/types";



export function extractTemplates(featureBlocks: BlockMap): {
    updatedBlocks: BlockMap;
    sharedTemplates: SharedTemplateMap;
} {
    const sharedTemplates: SharedTemplateMap = {}; // legacy placeholder

    for (const blockType in featureBlocks) {
        const blocksOfType = featureBlocks[blockType];
        if (!blocksOfType || typeof blocksOfType !== "object") continue;

        for (const blockId in blocksOfType) {
            const block = blocksOfType[blockId];
            if (!block || typeof block !== "object") continue;

            // ✅ Normalize canvas paths
            if (Array.isArray(block.canvas?.paths)) {
                block.canvas.paths = block.canvas.paths.map(normalizePathRef);
            }

            // ✅ Safely extract templates
            const rawTemplates =
                typeof block.templates === "object" && !Array.isArray(block.templates)
                    ? block.templates
                    : {};

            const templateKeys = Object.keys(rawTemplates);
            if (templateKeys.length > 0) {
                console.log("🧪 block.templates keys:", templateKeys);
            }

            const localTemplates: SharedTemplateMap = {};

            for (const templateKey of templateKeys) {
                let tplRaw: any;
                try {
                    tplRaw = rawTemplates[templateKey];
                } catch (err) {
                    console.error(`❌ Crash accessing templateKey ${templateKey}:`, err);
                    continue;
                }

                if (!tplRaw || typeof tplRaw !== "object") {
                    console.warn(`⚠️ Skipping non-object template: ${templateKey}`, tplRaw);
                    continue;
                }

                const refName =
                    typeof tplRaw.template_id === "string" && tplRaw.template_id.trim() !== ""
                        ? tplRaw.template_id.trim()
                        : templateKey;

                if (!localTemplates[refName]) {
                    localTemplates[refName] = {
                        template_id: refName,
                        template_type: typeof tplRaw.template_type === "string" ? tplRaw.template_type : "text",
                        is_active: typeof tplRaw.is_active === "boolean" ? tplRaw.is_active : true,
                        config: {
                            delay_seconds: typeof tplRaw.delay_seconds === "number" ? tplRaw.delay_seconds : 0,
                            emoji_style: typeof tplRaw.emoji_style === "string" ? tplRaw.emoji_style : "minimal",
                            tone: typeof tplRaw.tone === "string" ? tplRaw.tone : "neutral",
                            show_typing: typeof tplRaw.show_typing === "boolean" ? tplRaw.show_typing : true
                        },
                        locales: {}
                    };
                }

                const lang = typeof tplRaw.lang === "string" ? tplRaw.lang : "en";
                const localeContent: any = { lang };

                if (typeof tplRaw.text === "string") {
                    localeContent.text = tplRaw.text;
                }

                if (Array.isArray(tplRaw.cards)) {
                    localeContent.cards = tplRaw.cards;
                }

                localTemplates[refName].locales[lang] = localeContent;
            }

            // ✅ Inject block-scoped templates safely
            const templateRecord: Record<string, Template> = {};

            for (const tplId in localTemplates) {
                const shared = localTemplates[tplId];
                for (const lang in shared.locales) {
                    const locale = shared.locales[lang];
                    templateRecord[`${tplId}_${lang}`] = {
                        template_id: tplId,
                        template_type: shared.template_type,
                        lang: locale.lang,
                        is_active: shared.is_active,
                        text: locale.text,
                        cards: locale.cards,
                        delay_seconds: shared.config.delay_seconds,
                        emoji_style: shared.config.emoji_style,
                        tone: shared.config.tone,
                        show_typing: shared.config.show_typing
                    };
                }
            }

            block.templates = templateRecord;

        }
    }

    return {
        updatedBlocks: featureBlocks,
        sharedTemplates: {} // now empty
    };
}


export function normalizePathRef(path: any): any {
    if (!path || typeof path !== "object") return path;

    const ref =
        typeof path.template_id === "string" && path.template_id.trim() !== ""
            ? path.template_id.trim()
            : path.payload && typeof path.payload === "object" && typeof path.payload.node_id === "string"
                ? path.payload.node_id
                : null;

    if (ref) {
        path.template_ref = ref;
    }

    delete path.template_id;

    if (!path.payload || typeof path.payload !== "object") {
        path.payload = { node_id: ref ?? "unknown", template_type: "unknown", lang: "en" };
    }

    let current = path;
    while (current.next && typeof current.next === "object") {
        const nextRef =
            typeof current.next.template_id === "string" && current.next.template_id.trim() !== ""
                ? current.next.template_id.trim()
                : current.next.payload && typeof current.next.payload === "object" &&
                    typeof current.next.payload.node_id === "string"
                    ? current.next.payload.node_id
                    : null;

        if (nextRef) {
            current.next.template_ref = nextRef;
        }

        delete current.next.template_id;

        if (!current.next.payload || typeof current.next.payload !== "object") {
            current.next.payload = {
                node_id: nextRef ?? "unknown",
                template_type: "unknown",
                lang: "en"
            };
        }

        current = current.next;
    }

    return path;
}
