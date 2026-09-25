# Cielo Online · Tienda

Tienda online de flores artificiales y regalos (Perú, precios en soles con IGV).
Next.js 16 + TypeScript + Tailwind 4 + Supabase.

- Panel de administración: repositorio **cielo-admin** (en local, `../admin`).
- Base de datos, seguridad y workflows: [`supabase/README.md`](supabase/README.md).
- Arquitectura: [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Desarrollo

```bash
cp .env.example .env.local   # URL y anon/publishable key de Supabase
npm install
npm run dev                  # http://localhost:3000
```

## Despliegue en Vercel

1. **Base de datos primero.** El build lee el catálogo de Supabase (`store_catalog()`), así que las migraciones deben estar aplicadas:
   ```bash
   supabase db push --db-url "postgresql://postgres.<ref>:<password>@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
   ```
   Si faltan, el build falla con un mensaje que lo indica (mejor que publicar una tienda vacía).
2. En Vercel: **Add New → Project → Import** el repositorio `cielo-web`. Framework: Next.js (se detecta solo); no hace falta cambiar comandos ni carpeta raíz.
3. **Settings → Environment Variables** (Production y Preview):

   | Variable | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | la *publishable/anon key* (nunca la `service_role` ni la secret key) |
   | `NEXT_PUBLIC_AUTH_GOOGLE` | `true` solo si activaste Google en Supabase Auth (opcional) |

4. **Supabase → Authentication → URL Configuration**:
   - *Site URL*: `https://<tu-dominio>` (o el dominio `*.vercel.app`).
   - *Redirect URLs*: `https://<tu-dominio>/auth/callback` y, para previews, `https://*-<tu-equipo>.vercel.app/auth/callback`.
5. Deploy. Las páginas se regeneran solas cada 60 s (ISR), así que los cambios del admin (productos, precios, stock, tarifas) aparecen sin volver a desplegar.

Node.js 20.9 o superior (`engines` en `package.json`).
