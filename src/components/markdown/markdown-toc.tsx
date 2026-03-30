import Link from "next/link";

export interface MarkdownHeading {
    depth: number;
    text: string;
    slug: string;
}

interface MarkdownTocProps {
    headings: MarkdownHeading[];
}

export function MarkdownToc({ headings }: MarkdownTocProps) {
    if (headings.length === 0) {
        return null;
    }

    return (
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-white/45">
                Mục lục
            </p>
            <nav className="space-y-1.5">
                {headings.map((heading) => (
                    <Link
                        key={`${heading.slug}-${heading.depth}`}
                        href={`#${heading.slug}`}
                        className="block rounded-lg px-3 py-2 text-sm text-white/72 transition-colors hover:bg-white/5 hover:text-white"
                        style={{ paddingLeft: `${0.75 + (heading.depth - 2) * 0.9}rem` }}
                    >
                        {heading.text}
                    </Link>
                ))}
            </nav>
        </div>
    );
}
