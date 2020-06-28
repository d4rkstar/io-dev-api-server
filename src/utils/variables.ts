export const frontMatter2CTA = `---
it:
    cta_1: 
        text: "Richiedi ISEE"
        action: "iohandledlink://https://www.inps.it/nuovoportaleinps/default.aspx?itemdir=50088"
en:
    cta_1: 
        text: "Request ISEE"
        action: "iohandledlink://https://www.inps.it/nuovoportaleinps/default.aspx?itemdir=50088"
---
INPS ha completato le verifiche e risulta che il tuo nucleo familiare non ha un ISEE valido. 
 
E' necessario presentare una Dichiarazione Sostitutiva Unica (DSU) per il calcolo dell'ISEE, prima di richiedere nuovamente il Bonus Vacanze.

Puoi fare subito una [simulazione online](https://www.inps.it/nuovoportaleinps/default.aspx?itemdir=50088#h3heading4) sul sito dell'INPS 
per verificare la tua idoneità, oppure richiedere l'ISEE sui canali previsti da INPS.

Attenzione:il calcolo effettuato con la simulazione non ha valore certificativo e l'esito non sostituisce in alcun modo l'attestazione ISEE rilasciata dall'Inps`;

export const frontMatter2CTA2 = `---
it:
    cta_1: 
        text: "email IT"
        action: "iohandledlink://email:test@test.it"
    cta_2: 
        text: "pagamenti IT"
        action: "ioit://WALLET_HOME"
en:
    cta_1: 
        text: "email EN"
        action: "iohandledlink://email:test@test.it"
    cta_2: 
        text: "payments EN"
        action: "ioit://WALLET_HOME"
---`;

export const frontMatter1CTA = `---
it:
    cta_1: 
        text: "check ISEE"
        action: "ioit://BONUS_CTA_ELIGILITY_START"
---`;

export const frontMatterInvalid = `---
it:
    invalid_1: 
        text: "premi"
        action: "ioit://SERVICES_HOME"
en:
    cta_1: 
        text: "go1"
        action: "dummy://PROFILE_MAIN"
---`;

export const messageMarkdown = `
# blocco1 

  ## blocco2 

  ### blocco3 

  #### blocco4

  Test list: 
  - item1
  - item2 
  - item3 
  - item4 
  - item5 
  - item6 
  
È universalmente **riconosciuto** che un _lettore_ che **osserva** il layout di una pagina viene distratto dal contenuto testuale se questo è leggibile. Lo scopo dell’utilizzo del Lorem Ipsum è che offre una normale distribuzione delle lettere (al contrario di quanto avviene se si utilizzano brevi frasi ripetute, ad esempio “testo qui”), apparendo come un normale blocco di testo leggibile. Molti software di impaginazione e di web design utilizzano Lorem Ipsum come testo modello. Molte versioni del testo sono state prodotte negli anni, a volte casualmente, a volte di proposito (ad esempio inserendo passaggi ironici).

| copia e incolla il seguente link: \`https://verylongurl.com/verylong_very_long_very_long_very_long_very_long_very_long_very_long_very_long_very_long_very_long_very_long_very_long_\`

### link esterni

[LINK ESTERNO GOOGLE](https://www.google.it)

[LINK CORROTTO](google.it)

### link interni

[BONUS_AVAILABLE_LIST](ioit://BONUS_AVAILABLE_LIST)

[BONUS_CTA_ELIGILITY_START](ioit://BONUS_CTA_ELIGILITY_START)

[MESSAGES_HOME](ioit://MESSAGES_HOME)

[PROFILE_PREFERENCES_HOME](ioit://PROFILE_PREFERENCES_HOME)

[SERVICES_HOME](ioit://SERVICES_HOME)

[PROFILE_MAIN](ioit://PROFILE_MAIN)

[PROFILE_PRIVACY](ioit://PROFILE_PRIVACY)

[PROFILE_PRIVACY_MAIN](ioit://PROFILE_PRIVACY_MAIN)

[WALLET_HOME](ioit://WALLET_HOME)

[WALLET_LIST](ioit://WALLET_LIST)

[PAYMENTS_HISTORY_SCREEN](ioit://PAYMENTS_HISTORY_SCREEN)

[LINK CORROTTO](ioit://WRONG&$)`;
