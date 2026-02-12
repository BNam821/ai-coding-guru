import Image from "next/image";

interface WikiImageProps {
    src?: string;
    alt?: string;
    title?: string;
}

export function WikiImage(props: any) {
    const { src, alt, title } = props;
    if (!src) return null;

    // Check if external url
    const isExternal = src.startsWith("http");

    const displayCaption = title || alt;

    return (
        <figure className="my-8 block w-full rounded-xl overflow-hidden border border-white/10 bg-white/5">
            {isExternal ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={src}
                    alt={alt || "Wiki Image"}
                    className="w-full h-auto object-cover block !m-0"
                />
            ) : (
                <div className="relative w-full aspect-video">
                    <Image
                        src={src}
                        alt={alt || "Wiki Image"}
                        fill
                        className="object-cover block !m-0"
                    />
                </div>
            )}
            {displayCaption && (
                <figcaption className="text-center text-sm text-white/60 mt-2 italic px-4 py-2 border-t border-white/5 bg-white/5">
                    {displayCaption}
                </figcaption>
            )}
        </figure>
    );
}
