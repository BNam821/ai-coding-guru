import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Root } from "mdast";

const supportedCallouts = new Set(["info", "tip", "warning", "danger", "success"]);

export const remarkCallouts: Plugin<[], Root> = () => {
    return (tree) => {
        visit(tree, (node: any) => {
            if (
                (node.type === "containerDirective" || node.type === "leafDirective") &&
                supportedCallouts.has(node.name)
            ) {
                const data = node.data || (node.data = {});
                const attributes = node.attributes || {};
                const title =
                    (typeof node.label === "string" && node.label.trim()) ||
                    (typeof attributes.title === "string" && attributes.title.trim()) ||
                    undefined;

                data.hName = "div";
                data.hProperties = {
                    className: ["markdown-callout", `markdown-callout-${node.name}`],
                    ...(title ? { title } : {}),
                };
            }
        });
    };
};
