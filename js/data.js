// Curriculum metadata for Latvisky
// Each day links to its lesson markdown file. Days flagged 'quiz' or 'mock' get special UI.

const CURRICULUM = [
  // Week 1 — Fundamentos
  { day: 1,  week: 1, title: "Pronombres + verbo *būt*", topic: "Saludos, presentación", file: "lecciones/dia-01.md" },
  { day: 2,  week: 1, title: "Género + 6 declinaciones", topic: "Familia", file: "lecciones/dia-02.md" },
  { day: 3,  week: 1, title: "Verbos grupo 2 presente", topic: "Rutina diaria", file: "lecciones/dia-03.md" },
  { day: 4,  week: 1, title: "Verbos grupo 3 presente", topic: "Trabajo y estudios", file: "lecciones/dia-04.md" },
  { day: 5,  week: 1, title: "Verbos grupo 1 presente", topic: "Comida y bebida", file: "lecciones/dia-05.md" },
  { day: 6,  week: 1, title: "Números, hora, fechas", topic: "Calendario", file: "lecciones/dia-06.md" },
  { day: 7,  week: 1, title: "Repaso semana 1", topic: "Quiz Semanal 1", file: "lecciones/dia-07.md", tag: "quiz", quizId: 1 },

  // Week 2 — Los casos
  { day: 8,  week: 2, title: "Nominativo + Acusativo", topic: "Casa y muebles", file: "lecciones/dia-08.md" },
  { day: 9,  week: 2, title: "Genitivo", topic: "Posesiones, cuerpo", file: "lecciones/dia-09.md" },
  { day: 10, week: 2, title: "Dativo", topic: "Patikt, garšot", file: "lecciones/dia-10.md" },
  { day: 11, week: 2, title: "Locativo", topic: "Ciudad", file: "lecciones/dia-11.md" },
  { day: 12, week: 2, title: "Instrumental + 'ar'", topic: "Transporte", file: "lecciones/dia-12.md" },
  { day: 13, week: 2, title: "Adjetivos: concordancia", topic: "Colores, descripciones", file: "lecciones/dia-13.md" },
  { day: 14, week: 2, title: "Quiz Semanal 2", topic: "Los casos", file: "lecciones/dia-14.md", tag: "quiz", quizId: 2 },

  // Week 3 — Pasado + temas A2
  { day: 15, week: 3, title: "Pasado grupos 2 y 3", topic: "Fin de semana", file: "lecciones/dia-15.md" },
  { day: 16, week: 3, title: "Pasado grupo 1 irreg.", topic: "Biografía corta", file: "lecciones/dia-16.md" },
  { day: 17, week: 3, title: "Negación + preguntas", topic: "Estados de ánimo", file: "lecciones/dia-17.md" },
  { day: 18, week: 3, title: "Posesivos + demostrativos", topic: "Compras", file: "lecciones/dia-18.md" },
  { day: 19, week: 3, title: "Preposiciones + caso", topic: "Direcciones", file: "lecciones/dia-19.md" },
  { day: 20, week: 3, title: "Verbos reflexivos -ties", topic: "Salud, médico", file: "lecciones/dia-20.md" },
  { day: 21, week: 3, title: "Quiz Semanal 3", topic: "Pasado + temas A2", file: "lecciones/dia-21.md", tag: "quiz", quizId: 3 },

  // Week 4 — Futuro y producción libre
  { day: 22, week: 4, title: "Futuro (nākotne)", topic: "Planes, vacaciones", file: "lecciones/dia-22.md" },
  { day: 23, week: 4, title: "Modales", topic: "Permisos, obligaciones", file: "lecciones/dia-23.md" },
  { day: 24, week: 4, title: "Comparativos/superlativos", topic: "Clima", file: "lecciones/dia-24.md" },
  { day: 25, week: 4, title: "Conectores", topic: "Argumentar", file: "lecciones/dia-25.md" },
  { day: 26, week: 4, title: "Imperativo + frases sociales", topic: "Restaurante, hotel", file: "lecciones/dia-26.md" },
  { day: 27, week: 4, title: "Escritura: formularios", topic: "Anketa", file: "lecciones/dia-27.md" },
  { day: 28, week: 4, title: "Quiz Semanal 4", topic: "Futuro + producción", file: "lecciones/dia-28.md", tag: "quiz", quizId: 4 },

  // Week 5 — Prep examen
  { day: 29, week: 5, title: "Listening drill", topic: "Audios A2", file: "lecciones/dia-29.md" },
  { day: 30, week: 5, title: "Reading drill", topic: "Anuncios, e-mails", file: "lecciones/dia-30.md" },
  { day: 31, week: 5, title: "Writing drill", topic: "Carta corta x3", file: "lecciones/dia-31.md" },
  { day: 32, week: 5, title: "Speaking: 10 preguntas", topic: "Sobre ti", file: "lecciones/dia-32.md" },
  { day: 33, week: 5, title: "Speaking: imagen + situación", topic: "Describir", file: "lecciones/dia-33.md" },
  { day: 34, week: 5, title: "SIMULACRO 1", topic: "Examen completo", file: "lecciones/dia-34.md", tag: "mock" },
  { day: 35, week: 5, title: "Revisión + Quiz 5", topic: "Áreas débiles", file: "lecciones/dia-35.md", tag: "quiz", quizId: 5 },

  // Week 6 — Refinamiento + extras PR
  { day: 36, week: 6, title: "Áreas débiles + Historia LV", topic: "Vēsture", file: "lecciones/dia-36.md" },
  { day: 37, week: 6, title: "SIMULACRO 2", topic: "Examen completo", file: "lecciones/dia-37.md", tag: "mock" },
  { day: 38, week: 6, title: "Himno + historia", topic: "Dievs, svētī Latviju!", file: "lecciones/dia-38.md" },
  { day: 39, week: 6, title: "Escritura intensiva", topic: "Formulario + carta", file: "lecciones/dia-39.md" },
  { day: 40, week: 6, title: "Speaking final + repaso", topic: "Confianza", file: "lecciones/dia-40.md" }
];

const WEEKS = [
  { num: 1, name: "Fundamentos",            color: "from-blue-500/20 to-blue-700/20" },
  { num: 2, name: "Los casos",              color: "from-purple-500/20 to-purple-700/20" },
  { num: 3, name: "Pasado + temas A2",      color: "from-pink-500/20 to-pink-700/20" },
  { num: 4, name: "Futuro + producción",    color: "from-amber-500/20 to-amber-700/20" },
  { num: 5, name: "Prep examen",            color: "from-emerald-500/20 to-emerald-700/20" },
  { num: 6, name: "Refinamiento + PR",      color: "from-lvred/30 to-lvred-dark/30" }
];

const DECKS = [
  { id: 1, week: 1, name: "Semana 1 — Fundamentos", file: "flashcards/semana-01.csv", topic: "Saludos, pronombres, būt, familia" },
  { id: 2, week: 2, name: "Semana 2 — Casa, cuerpo, gustos", file: "flashcards/semana-02.csv", topic: "Vivienda, muebles, cuerpo humano, verbos de gusto" },
];

const QUIZZES = [
  { id: 1, week: 1, name: "Quiz Semana 1", file: "quizzes/semana-01.json" },
];

const GRAMMAR_TOPICS = [
  { id: 1, title: "Alfabeto y pronunciación", file: "gramatica/01-alfabeto-pronunciacion.md", emoji: "🔤" },
  { id: 2, title: "Pronombres + verbo būt", file: "gramatica/02-pronombres-y-but.md", emoji: "👥" },
  { id: 3, title: "Sustantivos: género y 6 declinaciones", file: "gramatica/03-sustantivos-genero-declinaciones.md", emoji: "📚" },
  { id: 4, title: "Verbos grupo 2 (presente)", file: "gramatica/04-verbos-grupo-2-presente.md", emoji: "🗣️" },
  { id: 5, title: "Verbos grupo 3 (presente)", file: "gramatica/05-verbos-grupo-3-presente.md", emoji: "✍️" },
  { id: 6, title: "Verbos grupo 1 (irregulares)", file: "gramatica/06-verbos-grupo-1-presente.md", emoji: "⚡" },
  { id: 7, title: "Números, hora, fechas", file: "gramatica/07-numeros-hora-fechas.md", emoji: "🔢" },
  { id: 8, title: "Nominativo + Acusativo", file: "gramatica/08-nominativo-acusativo.md", emoji: "🎯" },
  { id: 9, title: "Genitivo", file: "gramatica/09-genitivo.md", emoji: "🔗" },
  { id: 10, title: "Dativo", file: "gramatica/10-dativo.md", emoji: "🎁" },
];

// Conversation topics
const CONV_TOPICS = [
  { key: "iepazīšanās", es: "Conocerse", emoji: "👋" },
  { key: "ģimene", es: "Familia", emoji: "👨‍👩‍👧" },
  { key: "mājoklis", es: "Vivienda", emoji: "🏠" },
  { key: "darbs", es: "Trabajo", emoji: "💼" },
  { key: "ikdiena", es: "Rutina diaria", emoji: "⏰" },
  { key: "ēdiens", es: "Comida", emoji: "🍴" },
  { key: "iepirkšanās", es: "Compras", emoji: "🛒" },
  { key: "veselība", es: "Salud", emoji: "🏥" },
  { key: "brīvais laiks", es: "Tiempo libre", emoji: "🎨" },
  { key: "ceļošana", es: "Viajes", emoji: "✈️" },
  { key: "pilsēta", es: "Ciudad", emoji: "🏙️" },
  { key: "laikapstākļi", es: "Clima", emoji: "🌦️" },
  { key: "apģērbs", es: "Ropa", emoji: "👕" },
  { key: "svētki", es: "Fiestas", emoji: "🎉" }
];
