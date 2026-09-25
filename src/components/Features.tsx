import { Flower2, HandHeart, Heart, Truck } from "lucide-react";

const features = [
  { icon: Truck, title: "Envío rápido", text: "Recibe tu pedido en 3 días o menos." },
  { icon: HandHeart, title: "Hecho a mano", text: "Cada arreglo es armado a mano por floristas." },
  { icon: Flower2, title: "Duran para siempre", text: "Flores que no se marchitan ni necesitan agua." },
  { icon: Heart, title: "Satisfacción garantizada", text: "Te encanta o te devolvemos tu dinero." },
];

export function Features() {
  return (
    <section className="container-page grid gap-[9px] sm:grid-cols-2 lg:grid-cols-4">
      {features.map(({ icon: Icon, title, text }) => (
        <div key={title} className="rounded-[5px] p-[15px] text-center shadow-[inset_0_0_0_1px_#dfdfdf] lg:h-[115px]">
          <Icon className="mx-auto size-8 text-magenta" strokeWidth={1.3} />
          <h3 className="mt-[7px] heading text-[19.8px] leading-[1.15] text-ink">{title}</h3>
          <p className="mt-1 text-[14px] text-muted/75">{text}</p>
        </div>
      ))}
    </section>
  );
}
