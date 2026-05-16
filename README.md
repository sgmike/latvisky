# Latvisky — Plan 40 días para examen A2 de letón

Sistema personalizado para alcanzar el nivel A2 oficial (Valsts valodas prasmes pārbaude) en 40 días, con el objetivo de obtener la **residencia permanente en Letonia**.

## Cómo funciona

Cada día abres este repo y pides la lección del día. El asistente:

1. Te da la lección del día (30 min de gramática + vocab + ejercicios).
2. Te recuerda repasar las flashcards de la semana (10 min).
3. Activa **modo conversación real** en letón, corrigiendo errores en vivo (15-20 min).
4. Al final de cada semana hay un **quiz de 10 preguntas** sobre lo estudiado.

Tiempo total diario objetivo: **45-60 min**.

## Estructura del repo

```
latvisky/
├── README.md                    ← Este archivo
├── plan/
│   └── curriculum-40-dias.md    ← Plan completo día por día
├── examen/
│   └── estructura-A2.md         ← Cómo es el examen oficial
├── gramatica/                   ← Reglas + errores comunes + ejercicios
│   ├── 01-alfabeto-pronunciacion.md
│   ├── 02-pronombres-y-but.md
│   ├── 03-sustantivos-genero.md
│   └── ...
├── lecciones/                   ← Una lección por día
│   ├── dia-01.md
│   ├── dia-02.md
│   └── ...
├── flashcards/                  ← CSV importable a Anki / Quizlet
│   ├── semana-01.csv
│   └── ...
├── quizzes/                     ← Quiz semanal + respuestas
│   ├── semana-01.md
│   ├── semana-01-respuestas.md
│   └── ...
├── conversacion/                ← Modo conversación real
│   └── instrucciones.md
└── progreso.md                  ← Tracker personal
```

## Cómo invocar al asistente cada día

Ejemplos de mensajes:

- **"Dame la lección del día N"** → te da `lecciones/dia-N.md` o la crea.
- **"Modo conversación: hablemos de [tema] en letón"** → activa rol de hablante nativo, corrige errores.
- **"Explícame [tema gramatical] con ejercicios"** → mini-clase enfocada.
- **"Hazme el quiz semanal de la semana N"** → 10 preguntas, respuestas después.
- **"Repasemos las flashcards de la semana N"** → drill activo letón ↔ español.
- **"Corrígeme este texto: [...]"** → corrección detallada con explicación.

## Reglas del sistema

1. **Las explicaciones en español, los ejemplos en letón** (con traducción).
2. **Modo conversación = solo letón**, con correcciones en español al final.
3. Cada error que cometas se anota en `progreso.md` para repasos dirigidos.
4. Los simulacros completos del examen llegan en las semanas 5 y 6.

## Importar las flashcards

Los CSV están en formato Anki-friendly:

```
letón;español;ejemplo_letón;ejemplo_español
```

En Anki: `Archivo → Importar`, elegir `;` como separador, mapear campos.
