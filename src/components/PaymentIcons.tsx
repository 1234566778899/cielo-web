// Por ahora solo se cobra por Yape/Plin y transferencia bancaria.
const payments = [
  { label: "Yape", className: "bg-[#742284] text-white" },
  { label: "Plin", className: "bg-[#00c1d5] text-white" },
  { label: "Transf.", className: "bg-ocean text-white" },
];

export function PaymentIcons({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" }) {
  return (
    <ul className={`flex ${size === "sm" ? "gap-[5px]" : "gap-2"} ${className}`}>
      {payments.map((p) => (
        <li key={p.label} className={`grid place-items-center rounded-[3px] font-bold ${size === "sm" ? "h-6 w-[34px] text-[8px]" : "h-7 w-11 text-[10px]"} ${p.className}`}>
          {p.label}
        </li>
      ))}
    </ul>
  );
}
