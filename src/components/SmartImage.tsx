import Image, { type ImageProps } from "next/image";

/** next/image que no intenta optimizar los placeholders SVG. */
export function SmartImage({ alt, ...props }: ImageProps) {
  const svg = typeof props.src === "string" && props.src.endsWith(".svg");
  return <Image alt={alt} unoptimized={svg} {...props} />;
}
