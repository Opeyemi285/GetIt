// components/PngIcon.tsx
export default function PngIcon({
  src,
  size = 24,
  color = "currentColor",
  className = "",
}: {
  src: string;
  size?: number;
  color?: string;
  className?: string;
}) {
  const mask = `url(${src})`;
  return (
    <span
      aria-hidden
      className={className}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        backgroundColor: color,
        WebkitMaskImage: mask,
        maskImage: mask,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}