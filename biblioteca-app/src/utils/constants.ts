export const CATEGORIES = [
  "Catálogos de Exposição",
  "Fotografia",
  "História, Sociologia, Antropologia, Educação",
  "Povos Indígenas e Populações Tradicionais",
  "Políticas Públicas",
  "Políticas Culturais",
  "Música",
  "Dança",
  "Cinema",
  "Teatro",
  "Artes Plásticas, Artesanato",
  "Patrimônio",
  "Romance",
  "Poesia",
  "Infantil e Infanto-Juvenil",
  "Didáticos",
  "Sertão-Gerais",
  "Cerrado",
  "Educação Ambiental",
  "Meio Ambiente",
  "Mosaico Sertão Veredas-Peruaçu",
  "Turismo",
] as const;

export type Category = typeof CATEGORIES[number];

// Regras de negócio
export const LOAN_DURATION_DAYS = 15;
export const MAX_RENEWALS = 2;
export const MAX_ACTIVE_LOANS = 3;
