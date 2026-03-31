import { visit } from "unist-util-visit";
import type { Parent, Literal } from "unist";
import type { Plugin } from "unified";
import type { Root } from "mdast";

const EXPLICIT_HEADING_ID_PATTERN = /\s*\{#([A-Za-z0-9\-_:]+)\}\s*$/;

type HeadingChild = Parent | Literal;

function getLastLiteralNode(node: HeadingChild): Literal | null {
    if ("value" in node && typeof node.value === "string") {
        return node;
    }

    if ("children" in node && Array.isArray(node.children)) {
        for (let index = node.children.length - 1; index >= 0; index -= 1) {
            const child = node.children[index] as HeadingChild;
            const literalNode = getLastLiteralNode(child);

            if (literalNode) {
                return literalNode;
            }
        }
    }

    return null;
}

export const remarkHeadingIds: Plugin<[], Root> = () => {
    return (tree) => {
        visit(tree, "heading", (node: any) => {
            const lastLiteralNode = getLastLiteralNode(node);

            if (!lastLiteralNode || typeof lastLiteralNode.value !== "string") {
                return;
            }

            const match = lastLiteralNode.value.match(EXPLICIT_HEADING_ID_PATTERN);
            if (!match) {
                return;
            }

            const explicitId = match[1]?.trim();
            if (!explicitId) {
                return;
            }

            lastLiteralNode.value = lastLiteralNode.value.replace(EXPLICIT_HEADING_ID_PATTERN, "").trimEnd();

            const data = node.data || (node.data = {});
            data.hProperties = {
                ...(data.hProperties || {}),
                id: explicitId,
            };
        });
    };
};
