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
│   ├── web/        # Frontend React (Vite + shadcn)
│   └── agent/      # Backend Node.js che controlla Playwright
└── packages/
    └── shared/     # Tipi condivisi (Theme, Website, FormField)
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

## Utilizzo

1. Apri il browser su `http://localhost:5173`
2. Clicca su "Add new website"
3. Inserisci un URL e seleziona un tema
4. Clicca "Start"
5. Il browser Playwright si aprirà e navigherà all'URL
6. Clicca sul bottone flottante "Detect Form" in basso a destra
7. Il form verrà rilevato e i dati fake generati verranno mostrati in un overlay

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

