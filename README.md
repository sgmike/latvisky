# Latvisky — Curso completo de 40 días para examen A2 de letón

Sistema completo y personalizado para alcanzar el nivel A2 oficial (Valsts valodas prasmes pārbaude) en 40 días, con el objetivo de obtener la **residencia permanente en Letonia**.

## 📚 Contenido del curso

- **40 lecciones diarias** (1 archivo `.md` por día, 45-60 min)
- **28 archivos de referencia gramatical** organizados por tema
- **5 mazos de flashcards** (~530 palabras con ejemplos, formato Anki)
- **5 quizzes interactivos** con corrección automática
- **2 simulacros completos** del examen real (días 34 y 37)
- **Módulo de historia, geografía e himno** para residencia permanente

Funciona en dos modos:

1. **Web App / PWA** — Interfaz gráfica accesible desde móvil/computadora, instalable en home screen.
2. **Chat con Claude** — Lecciones personalizadas, conversación en letón, corrección de errores.

---

## 🚀 Cómo publicar la web app (GitHub Pages — gratis)

Una vez que merges esta rama a `main`:

1. En GitHub → repositorio `latvisky` → **Settings** → **Pages**.
2. **Build and deployment** → Source: **Deploy from a branch**.
3. Branch: `main`, folder: `/ (root)`. Save.
4. Espera 1–2 min. Verás tu URL: `https://sgmike.github.io/latvisky/`.
5. Abre esa URL en tu celular. En el navegador → "Añadir a pantalla de inicio". Listo, app instalada.

> Mientras pruebas sin mergear: en Pages también puedes elegir esta rama (`claude/learn-lithuanian-F0Ect`) como source.

### Probarlo localmente sin desplegar

```bash
cd latvisky
python3 -m http.server 8000
# abre http://localhost:8000 en el navegador
```

---

## 📱 Qué incluye la web app

- **Inicio**: tarjeta grande con la lección de hoy, racha, progreso global.
- **Días (Calendario)**: los 40 días en una cuadrícula, color-coded por semana. Toca un día → su lección.
- **Cards (Flashcards)**: estudio interactivo con flip, audio TTS letón (🔊), seguimiento de qué dominas.
- **Quiz**: 10 preguntas por semana, corrección automática inmediata, explicaciones por pregunta.
- **Yo (Progreso)**: estadísticas, calendario tipo "heatmap", historial de quizzes, herramientas.

Todo se guarda en **localStorage** del navegador → tu progreso persiste entre sesiones. No hay servidor, no hay cuentas, no hay rastreo.

---

## 🧑‍🏫 Cómo seguir el curso día a día

### En el chat con Claude

Cada día abres el chat y pides:

- **"Dame la lección del día N"** → genero `lecciones/dia-N.md`, aparece automáticamente en la web app.
- **"Modo conversación día N"** → te respondo SOLO en letón, corrijo al final.
- **"Hazme el quiz semanal N"** → genero `quizzes/semana-N.json`, juégalo en la web app.
- **"Genera flashcards de la semana N"** → CSV en `flashcards/semana-N.csv`.
- **"Corrígeme este texto: [...]"** → corrección detallada.
- **"Explícame [tema] con ejercicios"** → mini-clase enfocada.

### En la web app

- Abre tu URL desde el celular cada mañana.
- Pulsa la tarjeta roja "Día N" en el inicio → empieza la lección.
- Después de leer la lección, baja al fondo y pulsa "Marcar como completado".
- Pulsa "Cards" → estudia las flashcards de la semana actual.
- Si es día de quiz, pulsa "Quiz" → 10 preguntas con corrección automática.

---

## 📁 Estructura del repo

```
latvisky/
├── index.html              ← Web App (single page)
├── manifest.json           ← PWA manifest
├── sw.js                   ← Service worker (offline)
├── .nojekyll               ← GH Pages: servir tal cual
├── css/style.css           ← Estilos custom
├── js/
│   ├── app.js              ← Lógica de la app
│   └── data.js             ← Metadata del curriculum
├── vendor/                 ← Tailwind + marked locales (offline)
├── icons/                  ← Íconos PWA
├── plan/
│   └── curriculum-40-dias.md
├── examen/
│   └── estructura-A2.md
├── gramatica/              ← Reglas, ejercicios, errores comunes
├── lecciones/              ← Una por día (markdown)
├── flashcards/             ← CSV por semana, importable a Anki
├── quizzes/                ← JSON interactivos + MD legibles
├── conversacion/
│   └── instrucciones.md
├── progreso.md             ← Tracker (también dentro de la app)
└── README.md
```

---

## 🎯 Sobre el examen A2 oficial (resumen)

- 4 partes: **klausīšanās** (auditiva), **lasīšana** (lectura), **rakstīšana** (escritura), **runāšana** (oral).
- **60% en CADA parte** para aprobar — no es promedio.
- Para residencia permanente, además te examinan de **historia de Letonia** y el **himno nacional**.

Ver detalle completo en `examen/estructura-A2.md` o desde la web app → Inicio → "Examen A2 oficial".

---

## 🤝 Importar flashcards a Anki (opcional)

Los CSV están en formato Anki-friendly:

```
letón;español;ejemplo_letón;ejemplo_español
```

En Anki: `Archivo → Importar`, separador `;`, codificación UTF-8.

---

## 📚 Stack técnico (para curiosos)

- HTML + Tailwind CSS (Play CDN bundleado localmente) + marked.js (markdown → HTML)
- Vanilla JS, sin frameworks, sin build step
- PWA: manifest + service worker (offline-first después de la primera carga)
- TTS letón vía Web Speech API (calidad depende del SO/navegador)
- Persistencia: localStorage del navegador

**Veiksmi!** (Suerte 🍀)
