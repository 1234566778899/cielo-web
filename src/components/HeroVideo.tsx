"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Video de fondo del hero. Solo se descarga en pantallas grandes (desde 1024 px) y si el usuario
 * no pidió reducir el movimiento; en los demás casos se ve el póster (primer fotograma).
 */
export function HeroVideo({ poster, sources }: { poster: string; sources: { src: string; type: string }[] }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [wide, setWide] = useState(false);
  const [play, setPlay] = useState(false);

  useEffect(() => {
    const wide = window.matchMedia("(min-width: 1024px)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setWide(wide.matches);
      setPlay(wide.matches && !calm.matches);
    };
    update();
    wide.addEventListener("change", update);
    calm.addEventListener("change", update);
    return () => {
      wide.removeEventListener("change", update);
      calm.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (play) {
      video.load();
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [play]);

  // El video ocupa todo el alto anclado a la derecha y se funde por la izquierda con el azul de su propio borde (#0b5580).
  return (
    <div aria-hidden className="absolute inset-0 hidden bg-[#0b5580] lg:block">
      <video
        ref={ref}
        poster={wide ? poster : undefined}
        muted
        loop
        playsInline
        preload="none"
        className="absolute inset-y-0 -right-[12%] aspect-video xl:right-0 h-full max-w-none object-cover [mask-image:linear-gradient(to_right,transparent,black_18%)]"
      >
        {play && sources.map((s) => <source key={s.type} src={s.src} type={s.type} />)}
      </video>
    </div>
  );
}
