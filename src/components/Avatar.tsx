export function Avatar({
  name,
  variant,
  size = 36,
}: {
  name: string;
  variant: "a" | "b";
  size?: number;
}) {
  const bg = variant === "a" ? "bg-accent-a" : "bg-accent-b";
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-serif font-semibold text-white ${bg}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
