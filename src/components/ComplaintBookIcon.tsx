/** Ícono del Libro de Reclamaciones: libro abierto con renglones, como el distintivo que se exhibe en los comercios del Perú. */
export function ComplaintBookIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 40" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M24 9.5C19.5 5.8 12.5 4.5 4 5.5v27c8.5-1 15.5.3 20 4 4.5-3.7 11.5-5 20-4v-27c-8.5-1-15.5.3-20 4Z" />
      <path d="M24 9.5v27" />
      <path d="M9 12.5c3.8-.3 7.3.3 10.5 1.8M9 18c3.8-.3 7.3.3 10.5 1.8M9 23.5c3.8-.3 7.3.3 10.5 1.8" strokeWidth="1.8" />
      <path d="M39 12.5c-3.8-.3-7.3.3-10.5 1.8M39 18c-3.8-.3-7.3.3-10.5 1.8M39 23.5c-3.8-.3-7.3.3-10.5 1.8" strokeWidth="1.8" />
    </svg>
  );
}
