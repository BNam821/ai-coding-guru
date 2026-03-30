import { defaultSchema } from "rehype-sanitize";

export const markdownSanitizeSchema = {
    ...defaultSchema,
    attributes: {
        ...defaultSchema.attributes,
        a: [
            ...(defaultSchema.attributes?.a || []),
            ["className", /^.*$/],
            ["ariaLabel", /^.*$/],
            ["tabIndex", "-1"],
        ],
        code: [
            ...(defaultSchema.attributes?.code || []),
            ["className", /^language-.*$/, /^hljs.*$/],
        ],
        div: [
            ...(defaultSchema.attributes?.div || []),
            ["className", /^.*$/],
            ["title", /^.*$/],
        ],
        h1: [...(defaultSchema.attributes?.h1 || []), ["id", /^.*$/]],
        h2: [...(defaultSchema.attributes?.h2 || []), ["id", /^.*$/]],
        h3: [...(defaultSchema.attributes?.h3 || []), ["id", /^.*$/]],
        h4: [...(defaultSchema.attributes?.h4 || []), ["id", /^.*$/]],
        h5: [...(defaultSchema.attributes?.h5 || []), ["id", /^.*$/]],
        h6: [...(defaultSchema.attributes?.h6 || []), ["id", /^.*$/]],
        input: [
            ...(defaultSchema.attributes?.input || []),
            ["type", "checkbox"],
            ["checked"],
            ["disabled"],
        ],
        li: [
            ...(defaultSchema.attributes?.li || []),
            ["className", /^.*$/],
        ],
        ol: [
            ...(defaultSchema.attributes?.ol || []),
            ["className", /^.*$/],
        ],
        pre: [
            ...(defaultSchema.attributes?.pre || []),
            ["className", /^.*$/],
        ],
        span: [
            ...(defaultSchema.attributes?.span || []),
            ["className", /^.*$/],
        ],
        table: [
            ...(defaultSchema.attributes?.table || []),
            ["className", /^.*$/],
        ],
        td: [
            ...(defaultSchema.attributes?.td || []),
            ["className", /^.*$/],
            ["align", "left", "center", "right"],
        ],
        th: [
            ...(defaultSchema.attributes?.th || []),
            ["className", /^.*$/],
            ["align", "left", "center", "right"],
        ],
        ul: [
            ...(defaultSchema.attributes?.ul || []),
            ["className", /^.*$/],
        ],
    },
};
