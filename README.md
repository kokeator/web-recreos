# Liga de Recreos

Web de la liga del instituto: equipos y jugadores, calendario, clasificación, resultados y pistas.
Hecha con **Vue 3 + Vite**. Los datos se guardan en **Upstash Redis** mediante una función serverless de Vercel (`api/data.js`).
Todo el mundo ve la web; solo quien conoce la contraseña (`ADMIN_PASSWORD`) puede editar.

## Probarla en tu ordenador
```bash
npm install
npm run dev
```
Sin backend funciona en **modo demo**: eres organizador y los datos se guardan en tu navegador.

## Publicarla en Vercel
1. Sube la carpeta a un repositorio de GitHub.
2. En Vercel: **Add New → Project** e importa el repositorio (detecta Vite solo).
3. En el proyecto: **Storage → Create / Marketplace → Upstash Redis** y conéctalo. Vercel añade las variables de conexión.
4. En **Settings → Environment Variables** crea `ADMIN_PASSWORD` con la contraseña que quieras.
5. **Deployments → Redeploy**.

Pulsa "Acceso organizadores" en la web, escribe la contraseña y ya puedes añadir equipos y jugadores, generar el calendario y meter resultados. Se guardan solos.

Para probar el backend en local: `npm i -g vercel`, `vercel link`, `vercel env pull` y `vercel dev`.

## Uso
- **Equipos y jugadores**: pestaña de cada deporte → "Equipos y jugadores".
- **Calendario**: cuando estén todos los equipos, "Generar calendario" (todos contra todos). Después puedes cambiar fecha, hora, pista y resultado de cada partido.
- **Ajustes**: día, hora y pistas de cada deporte (se aplican al generar el calendario).
- Fecha de la primera jornada: `start` en `src/store.js`.
