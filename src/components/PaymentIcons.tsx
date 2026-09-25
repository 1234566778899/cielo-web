const payments = [
  { label: "VISA", className: "bg-[#1a1f71] text-white italic" },
  { label: "MC", className: "bg-[#252525] text-[#f79e1b]" },
  { label: "AMEX", className: "bg-[#2e77bc] text-white" },
  { label: "PayPal", className: "bg-white text-[#003087]" },
  { label: "Yape", className: "bg-[#742284] text-white" },
  { label: "Plin", className: "bg-[#00c1d5] text-white" },
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
