# QA Form Agent MVP

Un MVP estremamente semplice di un agente QA basato su browser automation.

## Stack Tecnologico

- **Monorepo**: Turborepo
- **Frontend**: React + Vite + TypeScript + shadcn/ui + TailwindCSS
- **Backend**: Node.js + Express + TypeScript + Playwright
- **Shared**: TypeScript types package

## Struttura del Progetto

```
composer/
├── apps/
│   ├── web/            # Frontend React (Vite + shadcn)
│   ├── agent/          # Backend Node.js che controlla Playwright
│   ├── landing/        # Landing page React (Vite + shadcn)
│   └── form-benchmark/ # Form testing benchmark app (React 19 + Vite + shadcn)
└── packages/
    └── shared/         # Tipi condivisi (Theme, Website, FormField)
```

## Setup

1. Installa le dipendenze:

```bash
pnpm install
```

2. Installa i browser di Playwright:

```bash
cd apps/agent
pnpm exec playwright install chromium
```

3. Avvia le applicazioni:

```bash
pnpm dev
```

Questo avvierà:

- Web app su `http://localhost:5173`
- Agent server su `http://localhost:3001`
- Landing page su `http://localhost:5174`
- Form benchmark su `http://localhost:5175`

## Link Deployati

- **Landing Page**: [composer.davideghiotto.it](https://composer.davideghiotto.it)
- **Form Benchmark**: [composer-benchmark.davideghiotto.it](https://composer-benchmark.davideghiotto.it)

## Utilizzo

1. Apri il browser su `http://localhost:5173`
2. Clicca su "Add new website"
3. Inserisci un URL e seleziona un tema
4. Clicca "Start"
5. Il browser Playwright si aprirà e navigherà all'URL
6. Clicca sul bottone flottante "Detect Form" in basso a destra
7. Il form verrà rilevato e i dati fake generati verranno mostrati in un overlay

## Form Benchmark

L'app `form-benchmark` è una suite di test per il comportamento di riempimento automatico dei form. Include 5 diversi tipi di form:

1. **Search Form**: Form con molti campi di ricerca, filtri e opzioni avanzate
2. **Text Form**: Form con molti campi di testo e textarea per contenuti lunghi
3. **Unusual Inputs**: Form con input non standard (date picker, color picker, slider, file upload, ecc.)
4. **User Data**: Form standard per dati utente (registrazione/profilo)
5. **Multi-Step**: Form multi-step complesso con validazione e campi condizionali

Per testare il form benchmark:

```bash
cd apps/form-benchmark
pnpm dev
```

L'app sarà disponibile su `http://localhost:5175` e può essere utilizzata come benchmark per testare il comportamento di riempimento automatico dei form.

## Temi Disponibili

- **Star Wars Hero**: Genera dati ispirati ai personaggi di una galassia lontana lontana
- **Marvel Superhero**: Crea dati con il potere degli eroi più potenti della Terra
- **Harry Potter Wizard**: Compila form con dati magici dal mondo dei maghi
- **The Office Employee**: Genera dati realistici per impiegati d'ufficio con un tocco di umorismo
- **Game of Thrones Noble**: Crea dati degni delle nobili casate di Westeros
- **Custom Theme**: Aggiungi il tuo tema personalizzato con titolo e descrizione

## Note

- Nessuna autenticazione richiesta
- I dati sono salvati in localStorage (web app)
- Il browser Playwright viene avviato in modalità headful (visibile)
- Il form detection è basico: trova il primo form nel viewport o nel DOM
- La generazione di dati fake è completamente deterministica (no LLM)
