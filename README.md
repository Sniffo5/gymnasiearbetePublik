# Dokumentation för Aron Loreskärs gymnasiearbete

## Inehållsförteckning

[1. Introduktion](#1-introduktion)

[2. Teknisk Översikt](#2-teknisk-översikt)

[3. Databasstruktur](#3-databasstruktur)

  - [3.1 Översikt](#31-översikt)
  - [3.2 Tabeller](#32-tabeller)
    - [3.2.1 users](#321-users)
    - [3.2.2 conversations](#322-conversations)
    - [3.2.3 conversation_members](#323-conversation_members)
    - [3.2.4 messages](#324-messages)
    - [3.2.5 message_reactions](#325-message_reactions)
  - [3.3 Relationer](#33-relationer)

[4. Funktionalitet](#4-funktionalitet)
  - [4.1 Initiering](#41-initiering)
  - [4.2 Utility-funktioner och databas-integration](#42-utility-funktioner-och-databas-integration)
    - [4.2.1 Utility-funktioner](#421-utility-funktioner)
    - [4.2.2 Databas-integration](#422-databas-integration)
  - [4.3 Autentisering](#43-autentisering)
    - [4.3.1 Registrering](#431-registrering)
    - [4.3.2 Inloggning](#432-inloggning)
  - [4.4 Chattfunktionalitet](#44-chattfunktionalitet)
    - [4.4.1 Realtids konversationer och dess funktionalitet](#441-realtids-konversationer-och-dess-funktionalitet)
        - [4.4.1.1 Initiering](#4411-initiering)
        - [4.4.1.2 Skicka meddelanden](#4412-skicka-meddelanden)
        - [4.4.1.3 Ta bort meddelanden](#4413-ta-bort-meddelanden)
        - [4.4.1.4 Redigera meddelanden](#4414-redigera-meddelanden)
    - [4.4.2 Återupptagande av konversationer](#442-återupptagandet-av-konversationer)
      - [4.4.2.1 message() funktionen](#4421-message)
      - [4.4.2.2 renderChat() funktionen](#4422-renderchat)
  - [4.5 Reaktioner på meddelanden](#45-reaktioner-på-meddelanden)
    - [4.5.1 Reaktioner i realtid](#451-reaktioner-i-realtid)
      - [4.5.1.1 Skicka reaktioner](#4511-skicka-reaktioner)
      - [4.5.1.2 Ta bort reaktioner](#4512-ta-bort-reaktioner)
    - [4.5.2 Återupptagandet av reaktioner](#452-återupptagandet-av-reaktioner)
  
## 1. Introduktion

För mitt gymnasiearbet har jag skapat en realtidschattapplikation med möjligheten att redigera, ta bort och reagera till inehåll.
Följ stegen på [avsnittet om installation](#5-installation-och-körning) för att testa projektet.



## 2. Teknisk Översikt

- Programeringspråk:
  - JavaScript
  - Html
  - CSS
  - SQL
- Bibliotek

  - **Bcrypt** - Bcrypt används för att hasha lösenord
  - **dotenv** - Miljövariabler används för att undvika känsliga uppgifter skrivs i klartext
  - **escape-html** - Används för att förstöra försök till XSS attacker genom att då sanitisera inehåll innan den visas med hjälp av escape-html.
  - **express** - Används för att skapa en server och hantera HTTP-förfrågningar. Express är ett ramverk för Node.js som gör det enklare att bygga webbapplikationer.
  - **express-session** - Används för att hantera sessioner och autentisering. Denna används för att hålla reda på inloggade användare och deras sessioner.
  - **mysql2** - Används för att kommunicera med MySQL-databasen. Denna modul gör det möjligt att köra SQL-frågor och hämta data från databasen. Variation 2 används då den möjliggör för att använda async/await syntaxen.
  - **socket.io** - Används för att skapa en realtids uppkoppling mellan servern och klienten. Fördelen med Socket.io är att den har redundans då den kan använda två olika teknologier beroende på ifall någon itne fungerar.
  - **uuid** - Används för att skapa unika identifikationer som är så gott som garanterade att vara unika.
  - **validator** - Används för att validera mejl addressers riktighet.

- Filstruktur
  - `client/`: Innehåller frontend-koden för chattapplikationen.
    - `client.js`: Huvudfilen för frontend-logik.
    - `homePage.js`: Logik för startsidan.
  - `html/`: Innehåller HTML-filer för olika sidor i applikationen.
    - `chat.html`: HTML-mall för chatt sidorna. Fylls på dynamiskt.
    - `index.html`: Huvud mallen för html:en som visas på sidan. Fylls på dynamiskt.
    - `loginForm.html`: HTML-formulär för inloggning.
    - `registerForm.html`: HTML-formulär för registrering.
  - `images/`: Innehåller bilder som används i applikationen.
    - `default_pfp.jpg`: Standard profilbilden.
  - `js/` : Innehåller backend-logik och databasfrågor.
    - `auth.js`: Backend-logik för autentisering och sessionhantering.
    - `database.js`: Databasanslutning och konfiguration.
    - `message.js`: Backend-logik för meddelanden.
  - `public/` : Innehåller statiska filer som CSS och bilder.
    - `style.css`: CSS för applikationen. Anpassar utseendet.
  - `index.js`: Huvudfilen för servern. Hanterar routing och Socket.IO.
  - `utils.js`: Innehåller hjälpfunktioner för att generera dynamiskt innehåll.

## 3. Databasstruktur

- ### **3.1. Översikt**

  Databasen är designad för att hantera en realtidschattapplikation och innehåller följande tabeller:

  - `users`
  - `conversations`
  - `conversation_members`
  - `messages`
  - `message_reactions`

  Varje tabell har ett specifikt syfte och relationer mellan tabellerna är definierade med hjälp av främmande nycklar.
  En främmande nyckel (Foreign Key) är en kolumn eller en uppsättning kolumner i en tabell som refererar till den primära nyckeln i en annan tabell. Den används för att skapa en relation mellan två tabeller och säkerställa dataintegritet. En främmande nyckel kan också kallas referensnyckel eller kopplingsnyckel. När en främmande nyckel används i en tabell, begränsar den värdena i den kolumnen till de värden som finns i den refererade tabellen. Detta säkerställer att endast giltiga data kan införas i tabellen och förhindrar inkonsekvenser i databasen.
  Främmande nycklar möjligör även fär att hämta relaterad information från flera tabeller med hjälp av JOIN-frågor. Detta är särskilt användbart i komplexa databaser.
  Främmande nycklar faciliterar att till exempel ifall en användare tas bort så tas även alla meddelanden och reaktioner som är kopplade till den användaren bort. Detta görs genom att sätta `ON DELETE CASCADE` på främmande nycklarna.

  ---

  ### **3.2. Tabeller**

    #### **3.2.1. `users`**

    Denna tabell lagrar information om användare.

    | Kolumn            | Datatyp        | Beskrivning                                                       |
    | ----------------- | -------------- | ----------------------------------------------------------------- |
    | `id`              | `char(36)`     | Primärnyckel. Unikt ID för varje användare.                       |
    | `username`        | `varchar(255)` | Användarnamn. Måste vara unikt.                                   |
    | `email`           | `varchar(255)` | Användarens e-postadress. Måste vara unik.                        |
    | `password`        | `varchar(255)` | Hashat lösenord för användaren.                                   |
    | `profile_picture` | `varchar(255)` | Länk till användarens profilbild. Standard är `/default_pfp.jpg`. |

    ---

    **Primärnyckel:** `id`  
    **Unika nycklar:** `username`, `email`

    ---

    #### **3.2.2. `conversations`**

    Denna tabell lagrar information om konversationer.

    | Kolumn       | Datatyp                   | Beskrivning                                                              |
    | ------------ | ------------------------- | ------------------------------------------------------------------------ |
    | `id`         | `char(36)`                | Primärnyckel. Unikt ID för varje konversation.                           |
    | `name`       | `varchar(255)`            | Namn på konversationen. För privata konversationer används användarnamn. |
    | `type`       | `enum('private','group')` | Typ av konversation (`private` eller `group`).                           |
    | `created_at` | `timestamp`               | Tidpunkt då konversationen skapades.                                     |


    ---

    **Primärnyckel:** `id`

    ---

    #### **3.2.3. `conversation_members`**

    Denna tabell hanterar medlemmar i konversationer.

    | Kolumn            | Datatyp      | Beskrivning                                                                        |
    | ----------------- | ------------ | ---------------------------------------------------------------------------------- |
    | `id`              | `char(36)`   | Primärnyckel. Unikt ID för varje medlem i en konversation.                         |
    | `conversation_id` | `char(36)`   | Främmande nyckel. Refererar till `conversations.id` i conversations tabellen.      |
    | `user_id`         | `char(36)`   | Främmande nyckel. Refererar till `users.id` i users tablellen.                     |     
    | `joined_at`       | `timestamp`  | Tidpunkt då medlemmen gick med i konversationen.                                   |
    | `pending`         | `tinyint(1)` | Indikerar om medlemmen har accepterat inbjudan (`1` = väntande, `0` = accepterad). |

    **Primärnyckel:** `id`  
    **Främmande nycklar:**

    - `conversation_id` → `conversations.id` i `conversations`-tabellen.
    - `user_id` → `users.id` i `users`-tabellen.

    ---

    #### **3.2.4. `messages`**

    Denna tabell lagrar meddelanden i konversationer.

    | Kolumn            | Datatyp                           | Beskrivning                                          |
    | ----------------- | --------------------------------- | ---------------------------------------------------- |
    | `id`              | `char(36)`                        | Primärnyckel. Unikt ID för varje meddelande.         |
    | `conversation_id` | `char(36)`                        | Främmande nyckel. Refererar till `conversations.id`. |
    | `sender_id`       | `char(36)`                        | Främmande nyckel. Refererar till `users.id`.         |
    | `message`         | `text`                            | Innehållet i meddelandet.                            |
    | `sent_at`         | `timestamp`                       | Tidpunkt då meddelandet skickades.                   |

    **Primärnyckel:** `id`  
    **Främmande nycklar:**

    - `conversation_id` → `conversations.id` i `conversations`-tabellen.
    - `sender_id` → `users.id` i `users`-tabellen.

    ---

    #### **3.2.5. `message_reactions`**

    Denna tabell hanterar reaktioner på meddelanden.

    | Kolumn       | Datatyp      | Beskrivning                                      |
    | ------------ | ------------ | ------------------------------------------------ |
    | `id`         | `char(36)`   | Primärnyckel. Unikt ID för varje reaktion.       |
    | `message_id` | `char(36)`   | Främmande nyckel. Refererar till `messages.id`.  |
    | `user_id`    | `char(36)`   | Främmande nyckel. Refererar till `users.id`.     |
    | `reaction`   | `varchar(5)` | Emoji eller symbol som representerar reaktionen. |
    | `reacted_at` | `timestamp`  | Tidpunkt då reaktionen gjordes.                  |

    **Primärnyckel:** `id`  
    **Främmande nycklar:**

    - `message_id` → `messages.id` i `messages`-tabellen.
    - `user_id` → `users.id` i `users`-tabellen.

    ---

  ### **3.3. Relationer**

    - **`users` ↔ `conversation_members`**: En användare kan vara medlem i flera konversationer.
    - **`conversations` ↔ `conversation_members`**: En konversation kan ha flera medlemmar.
    - **`conversations` ↔ `messages`**: En konversation kan innehålla flera meddelanden.
    - **`messages` ↔ `message_reactions`**: Ett meddelande kan ha flera reaktioner.
    - **`users` ↔ `message_reactions`**: En användare kan reagera på flera meddelanden.

    Denna struktur möjliggör en flexibel och skalbar design för att hantera interaktioner i applikationen.

## 4. Funktionalitet

### 4.1 Initiering

`index.js`

 ```javascript
const express = require("express");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const escape = require("escape-html");
const socketIo = require("socket.io");
const validator = require("validator");
require("dotenv").config();
```
Projektet initieras genom att importera nödvändiga "dependencies" (externa kodbibliotek). De olika biblioteken förklaras i avsnittet ["Teknisk Översikt"](#2-teknisk-översikt).

---
```javascript
const { render, funnyGenerate } = require("./utils.js");
const { showLogin, login, showRegister, register } = require("./js/auth.js");
const { query, closePool } = require("./js/database.js");
const { createServer } = require("http");
const { message } = require("./js/message.js");
```
Här importeras egna moduler som är skapade för projektet. Dessa moduler innehåller funktioner som används i projektet. Exempelvis `utils.js` innehåller funktioner för att generera HTML och `auth.js` innehåller funktioner för autentisering.

---
```javascript
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("client"));
app.use(express.static("public"));
app.use(express.static("images"));
```
Här skapas en Express-app. `express.urlencoded` används för att parsa URL-kodade data till objekt tillänglig via req.body, medan `express.static` används för att servera statiska filer som CSS och bilder.

---
```javascript
const server = createServer(app);
const io = socketIo(server);
```
Här skapas en HTTP-server med hjälp av Express och Socket.IO. `createServer` används för att skapa en server som kan hantera både HTTP-förfrågningar och WebSocket-förbindelser. `io` är instansen av Socket.IO som används för att hantera realtidskommunikation.

---
```javascript
const sessionMiddleware = session({
  secret: "keyboard cat",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    secure: true,
  },
});
```
Här definieras en session-middleware med hjälp av express-session. Denna middleware används för att hantera användarsessioner i applikationen.
`secret` En hemlig sträng som används för att signera session-ID:n i cookies. Detta säkerställer att cookies inte kan manipuleras av klienten.

`resave`: Om false sparas inte sessionen om den inte har ändrats. Detta minskar onödiga skrivningar till sessionlagringen.
saveUninitialized: Om true sparas en ny session även om den inte innehåller någon data. Detta kan vara användbart för att spåra användare innan de loggar in.

`cookie`: Inställningar för sessionens cookie:

`httpOnly`: Förhindrar att cookien kan nås via JavaScript på klienten, vilket ökar säkerheten.

`maxAge`: Anger cookiens livslängd i millisekunder. Här är den satt till 7 dagar.

`secure`: Om true eller production skickas cookien endast över HTTPS.

Denna middleware används för att hantera autentisering och hålla reda på användarens inloggningsstatus i applikationen.

---
```javascript
app.use(sessionMiddleware);
io.engine.use(sessionMiddleware);
```
Här används session-middleware för både Express-appen och Socket.IO-servern. Detta gör att sessiondata kan delas mellan HTTP-förfrågningar och WebSocket-anslutningar, vilket är viktigt för att hantera autentisering och användarsessioner i realtid.

---

```js
app.get("/", getConversations);
app.get("/login", showLogin);
app.post("/login", login);
app.post("/register", register);
app.get("/register", showRegister);
app.get("/message/:id", message);
app.get("/funny", funny);
app.get("/test", test);
```

Här defineras olika rutter för applikationen. Varje rutt är kopplad till en specifik funktion som hanterar begäran. Exempelvis `app.get("/login", showLogin);` kör showLogin funktionen när användaren navigerar till `/login`.

---

```js
io.on("connection", handleConnection);
```
Här lyssnar Socket.IO-servern på nya anslutningar. När en ny klient ansluter körs `handleConnection`-funktionen.

---
```javascript
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
  console.log(Date() + " 5");
});
```
Sedan i slutet av `index.js` så startas servern på en angiven port. Om ingen port är angiven används port 3000 som standard. När servern startar loggas ett meddelande i konsolen och vilken tid servern startades.

---
---
### 4.2. Utility-funktioner och databas-integration 

#### **4.2.1 Utility-funktioner**

För att minimera upprepningar av kod så har vissa funktioner flyttats till `utils.js`. Som tidigare förklarats så importeras funktionerna in i `index.js` och andra eventuella filer, där de kallas på och körs. De mest upprepade och oftast mest användbara funktionerna finns i `utils.js`.

---

```javascript
function render(content) {
  let html = fs.readFileSync("html/index.html").toString();

  html = html.replace("**content**", content);

  return html;
}
```

Här definieras funktionen `render()`. Funktionen tar in en variabel som den döper till `content`. Sedan hämtar den in html mallen `index.html`. I mallen finns `<main>**content**</main>` i body. Funktionen skapar då en variabel vid namn html som den fyller med `index.html` i strängformat. Därefter definieras om inehållet av variabeln till vad den nyss blev deklarerad till men med en skillnad, `**content**` har byts ut till vad variabeln content inehåller. Därefter returneras `html` som nu inehåller mallen med det nya inehållet funktionen tog emot.

---

```javascript
module.exports = { render};
```

Efter alla utility-funktioner har definerats så exporterar vi dem till alla ställen de importeras.

---
#### **4.2.2 Databas-integration**

Uppkopplingen till databasen sker i `database.js`. Denna fil hanterar anslutningen till MySQL-databasen och exekveringen av SQL-frågor. Här är en genomgång av dess funktionalitet:

```javascript
require("dotenv").config();
const mysql = require("mysql2/promise");
```
Miljövariabler: `dotenv` används för att läsa in känsliga uppgifter som databasvärdar, användarnamn och lösenord från `.env`-filen. Detta säkerställer att dessa uppgifter inte hårdkodas i koden.

MySQL-modul: `mysql2/promise` används för att skapa en anslutningspool och `/promise` möjliggöra användning av `async/await` för att hantera databasfrågor.

---
```javascript
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
```
- Anslutningspool: En anslutningspool skapas med hjälp av mysql.createPool. Detta gör att flera anslutningar kan hanteras effektivt samtidigt.
    - `host`, `user`, `password`, `database`: Dessa värden hämtas från .env-filen.
    - `waitForConnections`: Om `true` väntar poolen på att en anslutning ska bli tillgänglig om alla anslutningar används. Detta skapar ett "kö-system" för förfrågningar, vilket säkerställer att inga förfrågningar går förlorade.
    - `connectionLimit`: Begränsar antalet samtidiga anslutningar till 10.
    - `queueLimit`: Begränsar antalet väntande anslutningar. `0` innebär ingen gräns.

---
```javascript
async function query(sql, params) {
  const [results] = await pool.execute(sql, params);
  return results;
}
```
`query-funktionen`: Denna funktion används för att exekvera SQL-frågor.
 - `sql`: SQL-frågan som ska köras.
 - `params`: Parametrar som används i SQL-frågan för att undvika SQL-injektion.
 - `pool.execute`: Kör SQL-frågan och returnerar resultatet.
 - `[results]` vi kör fält-destrukturering på svaret då vi vill enbart veta vad som finns på första positionen i fältet. På andra positionen finner vi metadata om tabellen som vi inte vill skicka vidare och istället ignorerar i detta steg.

**Exempel på användning av query**:
```js
const sql = "SELECT * FROM users WHERE email = ?";
const params = ["example@example.com"];
const user = await query(sql, params);
console.log(user);
```
I detta exempel hämtas en användare från databasen baserat på e-postadressen. Parametern `?` i SQL-frågan ersätts med värdet i `params`-arrayen, vilket skyddar mot SQL-injektion.

---
```js
async function closePool() {
  await pool.end();
}
```
`closePool`-funktionen: Denna funktion stänger anslutningspoolen när den inte längre behövs. Detta är användbart vid serveravstängning för att frigöra resurser.

---
---

### 4.3. Autentisering



Autensiering är en viktig del av applikationen för att säkerställa att endast registrerade användare kan använda chattfunktionerna. All autentisering sker i `auth.js` och importeras till `index.js`. Här är en översikt över autentiseringens funktionalitet:

#### **4.3.1. Registrering**
När en användrare tar sig till /register, antingen via att de har sökt sig in dit eller följt en länk dit så körs funktionerna:
`showRegister`. När en användare skickar en post förfrågan till `/register` körs `register`. Dessa funktioner hanterar registrering av nya användare. 

---
```javascript
function showRegister(req, res) {
  const html = fs.readFileSync("html/registerForm.html").toString();
  res.send(render(html));
}
```
Funktionen showRegister laddar in registreringsformuläret från `html/registerForm.html` och omvandlar den till en sträng med html "koden" med `.toString()` och skickar det till klienten via `render()`. 

---
```javascript
async function register(req, res) {
  let data = req.body;

  if (!validator.isEmail(data.email) || data.password.trim() === "") {
    return res.redirect("/register");
  }
  if (
    data.username.trim() === "" ||
    data.username.length < 3 ||
    data.username.length > 20
  ) {
    return res.redirect("/register");
  }

  try {
    data.password = await bcrypt.hash(data.password, 12);
    data.id = uuidv4();

    await query(
      "INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)",
      [data.id, data.username.trim(), data.email, data.password]
    );

    req.session.email = data.email;
    req.session.loggedIn = false;
    req.session.userId = data.id;
    req.session.username = data.username;

    res.redirect("/login");
  } catch (error) {
    console.error("Error registering user:", error);
    res.send(render("Ett fel uppstod vid registrering. Försök igen senare."));
  }
}
```
Funktionen `register()` hanterar registreringen av nya användare. Den tar emot data från ett formulär via `req.body` och utför följande steg:

1. **Validering av inmatning**  
   Funktionen kontrollerar om den angivna e-postadressen är giltig med hjälp av `validator.isEmail`. Den kontrollerar också att lösenordet inte är tomt och att användarnamnet uppfyller kraven på längd (minst 3 och högst 20 tecken). Om någon av dessa kontroller misslyckas omdirigeras användaren tillbaka till registreringssidan.

2. **Hashning av lösenord**  
   Om valideringen lyckas hashas lösenordet med `bcrypt.hash` för att säkerställa att det lagras säkert i databasen.

3. **Generering av unikt ID**  
   Ett unikt ID genereras för användaren med hjälp av `uuidv4`.

4. **Lagring i databasen**  
   Användarens data (ID, användarnamn, e-post och hashat lösenord) sparas i databasen med hjälp av en SQL-fråga via `query`.

5. **Skapande av session**  
   Efter att användaren har registrerats sparas viss information i sessionen, såsom e-post, användar-ID och användarnamn. Dock sätts `loggedIn` till `false` eftersom användaren ännu inte är inloggad.

6. **Omdirigering till inloggningssidan**  
   När registreringen är klar omdirigeras användaren till inloggningssidan.

7. **Felhantering**  
   Om något går fel under processen loggas felet i konsolen och användaren får ett meddelande om att ett fel inträffade.

**Denna funktion säkerställer att endast giltig och säker data lagras i databasen och att användare smidigt registreras.**

---
#### **4.3.2. Inloggning**

Inloggningen hanteras också i `auth.js` och består av två funktioner: `showLogin` och `login`. `showLogin` fungerar precis som `showRegister` som förklaras i [4.3.1. Registrering](#431-registrering).

---
```javascript
async function login(req, res) {
  const data = req.body;

  try {
    const [user] = await query("SELECT * FROM users WHERE username = ?", [
      data.username,
    ]);

    if (!user) {
      return res.redirect("/login");
    }

    const check = await bcrypt.compare(data.password, user.password);

    if (!check) {
      return res.redirect("/login");
    }

    req.session.email = user.email;
    req.session.loggedIn = true;
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.profilePicture = user.profile_picture;

    res.redirect("/");
  } catch (error) {
    console.error("Error logging in:", error);
    res.send(render("Ett fel uppstod vid inloggning. Försök igen senare."));
  }
}
```
`login`-funktionen:
Denna funktion hanterar inloggningen av användare. Den tar emot data från ett formulär via `req.body` och utför följande steg:
1. Hämtar användaren från databasen baserat på användarnamnet.
2. Om användaren inte finns, omdirigeras användaren tillbaka till inloggningssidan.
3. Jämför det inskickade lösenordet med det hashade lösenordet i databasen med hjälp av `bcrypt.compare`.
4. Om lösenorden inte matchar, omdirigeras användaren tillbaka till inloggningssidan.
5. Om inloggningen lyckas sparas användarens information i sessionen, inklusive `e-post`, `användar-ID`, `användarnamn` och `profilbild`.
6. Användaren omdirigeras till startsidan.

---
**Inloggningsdelen säkerställer att endast registrerade användare med korrekt lösenord kan logga in. Sessionen används för att hålla reda på användarens inloggningsstatus och information under hela sessionen.**

---
---

### 4.4. Chattfunktionalitet
Huvuddelen av projektet ligger i hur chatterna fungerar, hur man skickar medelanden och i realtid visa det för andra användare. Hur databasen uppdateras för varje medelande som skickas och datan förändras när medelanden redigeras eller tas bort. Detta är för att när användaren returnerar till chatten ska de kunna se de medelanden de hade skickat förra gången och fortsätta konversationen. Varje medelande skickas som en pingpong boll mellan klienten och servern. Därför finns det många olika filer att gå genom som alla påverkar chattfunkionaliteten.

Först kommer jag diskutera hur medelanden fungerar på klient sidan och hur den fungerar i symbios med servern för att uppdatera alla klienters vy samtidigt. [Realtids konversationer](#441-realtids-konversationer-och-dess-funktionalitet)

Därefter kommer jag förklara hur konversationer visas åter igen när användaren returnerar till chatten. [Återupptagande av konversationer](#442-återupptagandet-av-konversationer)

---

#### 4.4.1 Realtids konversationer och dess funktionalitet

- [Initiering](#4411-initiering)
- [Skicka meddelanden](#4412-skicka-meddelanden)
- [Ta bort meddelanden](#4413-ta-bort-meddelanden)
- [Redigera meddelanden](#4414-redigera-meddelanden)

##### **4.4.1.1 Initiering**

Initieringen av realtidskonversationer sker genom att klienten och servern kopplas samman med hjälp av Socket.IO. Detta möjliggör realtidskommunikation mellan användare i en konversation. Socket.io använder både WebSockets och long polling för att möjliggöra realtidskommunikation. Den försöker först använda WebSockets, men faller tillbaka på polling om det inte stöds i användarens miljö.

WebSockets skapar en öppen tvåvägskanal mellan klient och server, där båda kan skicka och ta emot data utan att upprepa HTTP-förfrågningar. Det är snabbt, effektivt och idealiskt för applikationer som kräver låg fördröjning.

Long polling innebär att klienten skickar en begäran och väntar tills servern har något att svara med. När svar kommer skickas genast en ny begäran. Det simulerar realtidskommunikation men är mer belastande för servern. Bör endast användas som en reserv.

---

**Klient-sidan** `client/client.js`:  
På klient-sidan används Socket.IO för att ansluta till servern och lyssna på inkommande meddelanden.

```javascript
var socketClient = io("https://tjatta.xyz");

socketClient.emit("join", conversationId);
```

`socketClient.emit("join", conversationId)`: Klienten ansluter till en specifik konversation genom att skicka `conversationId` under "join" händelsen till servern.

---
```javascript
const input = document.getElementById("input");
input.addEventListener("keydown", handleKeyDown);
```
Vi hämtar vilket element som har id:t `input` det är inmatningsrutan för att skicka ett meddelandet i en chatt. Därefter lägger vi till en händelse avlyssnare på när klienten trycker på en tagent på deras tagentbord. Ifall de gör det kör vi `handleKeyDown()`.

```javascript
function handleKeyDown(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleFormSubmit(e);
  }
}
```
Denna funktion hanterar tangenttryckningar i inmatningsfältet. Om användaren trycker på `Enter` utan att hålla nere `Shift` skickas meddelandet direkt via `handleFormSubmit()`. Detta gör det enkelt att skicka meddelanden snabbt. Detta är också till för att man ska kunna skriva på olika rader i ett medelanden utan att det skickas iväg innan man är klar, ifall man vill ha en ny rad kan man dp enkelt trycka ner `Shift` och `Enter`.
e i funktionen står för event objektet som skickas med i `keydown` händelser. Vi använder den för att få information om vad för knappar som trycks och påverka deras funktioner.
`preventDefault()` i denna funktion ser till så att den normala funktionen för `ENTER` inte körs (alltså skapa en ny rad), vi vill ju att de inte ska ske då vi ska skicka iväg medelandet med `handleFormSubmit()` istället för att forsätta skriva.

---
```javascript
const form = document.getElementById("form");
form.addEventListener("submit", handleFormSubmit);
```
Vi väljer formuläret via dess id `form` och lägger till en `EventListener` som kör funktionen handleFormSubmit. Detta är för när klienten väljer att skicka iväg medelandet via `submit`-knappen så ska medelandet skickas via handleFormSubmit.

---
```javascript
input.addEventListener("input", handleInputResize);

function handleInputResize() {
  this.style.height = Math.min(this.scrollHeight, 80) + "px"; 

  if (this.value.trim()) {
    sendButton.disabled = false;
  } else {
    sendButton.disabled = true;
  }
}
```
Vi lägger till en alyssnare på när klienten skriver i `input`-elementet och då kör `handleInputResize`-funktionen.

`handleInputResize()` fungerar så den påverkar css för `input`-elementet med `this.style`. Den tar emot höjden av texten som användaren har skrivit och via `Math.min()` väljer det mindre värdet mellan höjden som krävs för att visa texten utan att skrolla (`this.scrollHeight`) och `80px`. Det är på så sätt vi kan dynamiskt ändra höjden av `input` men stoppa ett max tak på `80px` för att den inte ska kunna eventuellt ta upp hela skärmen.

Därefter kör vi en if-sats som kontrollerar ifall det är något skrivet i `input`, ifall det inte finns så avaktiverar vi skicka knappen och därmed ändrar utseendet med den till att vara utgråad och ändrar muspekaren till ett kryss.

---
```javascript
let activeMessageMenu = null;
let activeMessageId = null;

function toggleMessageMenu(messageId) {
  if (activeMessageMenu) {
    activeMessageMenu.classList.remove("active");

    if (activeMessageId === messageId) {
      activeMessageMenu = null;
      activeMessageId = null;
      return;
    }
  }
  reactionPicker.classList.remove("active");
  const messageContainer = document.querySelector(
    `.message-container[data-id="${messageId}"]`
  );
  if (messageContainer) {
    const menu = messageContainer.querySelector(".message-menu");
    menu.classList.add("active");
    activeMessageMenu = menu;
    activeMessageId = messageId;
  }
}
```

Funktionen hanterar visningen av meddelandemenyn för meddelandet med id:t `messageId`.

Funktionen börjar med att kontrollera ifall det finns en aktiv meny redan, ifall det finns en görs den inaktiv.

Därefter kontrollerar vi om meddelande id:t vi fick medskickat är samma som den aktiva menyns id (är `null` som standard). Ifall det stämmer sätts aktiv meny till `null` och menyn stängs.

Vi stänger reaktionsväljaren ifall den är aktiv då vi vill kunna välja den och inte eventuellt öppna den två gånger.

Därefter hittar vi upp vilket medelandet `messageId` tillhör, ifall den finns så aktiverar vi menyn för det medelandet och bara det medelandet.

Funktionen körs när någon trycker på meny knappen, vi skapar en `eventlistener` för detta när vi skapar chatter, nya och gamla.

---
```javascript
function scrollToBottom() {
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
```
`ScrollToBottom()` ser till så att klienten alltid ser det senaste medelandet. Den körs när nya medelanden skickas och då skickar användaren ner till att se det senaste. På så sätt slipper de skrolla ner konstant. Den skrollar från toppen av `messagesDiv` (elementet där alla meddelanden finns i) med höjden av elementet. Alltså den skrollar till botten av elementet.

---
```javascript
function handleDocumentClick() {
  if (activeMessageMenu) {
    activeMessageMenu.classList.remove("active");
    activeMessageMenu = null;
    activeMessageId = null;
  }
  reactionPicker.classList.remove("active");
}
```
Denna funktionen är till för att ifall användaren trycker utanför någon menyn så stängs dem. 

---

##### **4.4.1.2 Skicka meddelanden**

Meddelanden vid realtidskonverstaioner sker via "sockets" som tidigare diskuterat i [initiering](#4411-initiering).
När en användare skickar en chatt så skapas ett nytt element med meddelandet och allt som följer med den. 
Användaren skickar en händelse "chat" med data till servern som sparar den och sedan skickar tillbaka den med lite förändringar, sedan tar klienten emot den och skapar element med meddelandet.

---
```javascript
function handleFormSubmit(e) {
  e.preventDefault();
  let msg = input.value;

  if (msg) {
    socketClient.emit("chat", { msg, conversationId });
    input.value = "";
    input.style.height = "auto";
    sendButton.disabled = true;
  }
}
```
Resan för ett meddelandet börjar med `handleFormSubmit()`. Här tar vi emot medelandet från `input.value`.
Ifall det finns ett meddelandet så skickar vi ett `"socket"` event vid namn "chat", vi skickar med ett objekt som inehåller meddelandet och konversations-id:t.
Därefter så tömmer vi input och återställer utseendet till standard för när textrutan är tom.

---
```javascript
socket.on("chat", async (data) => {
    if (!data.msg || !validator.isLength(data.msg, { min: 1, max: 500 }))
      return;

    const sanitizedMessage = escape(data.msg);

    try {
      let messageId = uuidv4();

      await query(
        `
                    INSERT INTO messages (id, conversation_id, sender_id, message, message_type)
                    VALUES (?, ?, ?, ?, 'text')
                `,
        [messageId, data.conversationId, session.userId, sanitizedMessage]
      );

      io.to(data.conversationId).emit("chat", {
        senderId: session.userId,
        message: sanitizedMessage,
        messageId: messageId,
        username: session.username,
        profilePicture: session.profilePicture,
      });
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });
```
**Vi följer med medelandet på dess resa när den åker till `Index.js` (servern).**

När servern tar emot "socket eventet" chat så körs en anonym asynkron funktion.
I funktionen så börjar vi med att kontrollera att det finns dett medelandet och att meddelandet är inom tecken gränserna `1<x<500`, ifall den inte är det så avbryter vi med `return;`.

Men ifall meddelandet accepteras så sanitiserar vi den (skyddar mot `xss`-attacker) med `escape()`.
Därefter börjar huvuddelen av funktionen.
Vi deffinerar meddelande id:t med `uuidv4()`.
Därefter skickar vi en förfrågan till servern där vi vill infoga meddelandet i `messages` tabellen i databasen. Vi ser till att använda os av "params" tekniken vi definerade i [database.js](#422-databas-integration) för att undvika SQL-injections. Vi skickar med meddelande-id:t, konverstaions-id:t, användarens användar-id och det sanitiserade meddelandet. Lägg märke till await här som förhindrar att vi går vidare tills vi har gjort klart förfrågan till databasen.

Därefter skickar vi till alla användare i "socket gruppen" med konversations-id:t socket eventet chat tillsamans med massa data.
Vi skickar användarId:t av avsändaren, meddelandet, meddelandeId:t, användarnamnet av avsändaren och profilbilden av avsändaren.

Eftersom vi har stoppat huvudsatsen av funktionen i en `try catch` så kan vi fånga upp fel (`error`), istället för at tservern crashar på grund av felet så fortsätter den och vi loggar i konsolen vad som gick fel.

---
```javascript
socketClient.on("chat", function (data) {
  displayMessage(data);
  scrollToBottom();
});
```
**Nu följer vi medelandet tillbaka när den åker till `client.js` (klienten).**

`socketClient.on("chat", ...)`: Lyssnar på inkommande meddelanden från servern och visar dem i chattfönstret genom funktionen `displayMessage()` som den skickar med datan som den tar emot från servern. `scrollToBottom` körs efter meddelandet har skapats vilket skrollar användaren ner till det senaste medelandet.

---
```javascript
function displayMessage(data) {
let isSelf = false;
  if (data.username === loggedInUsername) {
    isSelf = true;
  }

  let messageId = data.messageId;
  let timestamp = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  let messageContainer = document.createElement("div");
  if (isSelf) {
    messageContainer.className = "message-container message-self";
  } else {
    messageContainer.className = "message-container message-other";
  }
  messageContainer.dataset.id = messageId;

  let contentWrapper = document.createElement("div");
  contentWrapper.className = "message-content-wrapper";

  let avatar = document.createElement("img");
  if (isSelf) {
    avatar.src = loggedInPfp;
  } else {
    avatar.src = otherUserPfp;
  }
  avatar.alt = data.username;
  avatar.className = "message-avatar";

  /.../
```
**Nu följer vi medelandet in i funktionen `displayMessage()`. Eftersom funktionen är så stor så går vi genom den del för del**
 Vi börjar med att deklarera variabeln isSelf och gör den sann ifall användarens användarman är samma som den som skickades med i data från servern (avsändarens användarnamn). `loggedInUsername` och annan information om användaren skickas med ifrån servern när den renderar konversationen.

 Därefter definerar vi `messageId` till det id:t som skickades med i datan.
 Samt "skriver" vi ner vad för tidspunkt vi har tagit emot medelandet i formatet med timmar och minuter med två tecken per. Alltså sparas tiden i formatet `XX:XX`. Tiden som sparas är anpassad till klientens tidzon.

 Sedan börjar vi skapa meddelandet. Vi låter `messageContainer` bli en ny div i dokumentet. Vi kommer anpassa elementet rejält.
 Vi skollar sedan ifall meddelandet skickades av användaren eller någon annan. Ifall klienten har själv skickat den så lägger vi till klassen `message-self`, annars lägger vi till `message-other`. Detta är för att särskilja meddelanden som man själv har skickat och vad andra har skickat. Oavsett lägger vi också till klassen `message-container`.

 I `messageContainer` lägger vi till id i form av ett "dataset", det är för att vi ska kunna hantera meddelandet med dess id utan att den visas visuellt. Den ska finnas på meddelandet men inte synas när man kollar på meddelandet.

 Därefter skapar vi ett till element men nu med klassen `message-content-wrapper`, den kommer användas för att innehålla meddelandet och avataren. Den kommer bli ett "barn" till `messageContainer`:n det betyder den kommer finnas i `messageContainer` men det görs senare.

 Sedan skapar vi ett bild element och sätter att bilden den använder ska vara klientens profilbild ifall de själv har skickat meddelandet men ifall det inte var dem så blir bilden till profil bilden av den som har skickat det. Vi sätter alternativ texten till namnet på avsändaren och ger bilden klassen `message-avatar`.


```javascript
/.../
let bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.textContent = data.message;
  let menuButton = document.createElement("button");
  menuButton.className = "message-menu-button";
  menuButton.innerHTML = '<span class="icon-dots"></span>';
  
  let messageInfo = document.createElement("div");
  messageInfo.className = "message-info";
  let sender = document.createElement("span");
  sender.className = "message-sender";
  sender.textContent = data.username;
  let time = document.createElement("span");
  time.className = "message-time";
  time.textContent = timestamp;
  const menu = document.createElement("div");
  menu.className = "message-menu";
  let menuHTML =
    '<button class="message-menu-item" data-action="react">' +
    '<span class="message-menu-icon icon-reaction"></span>' +
    "Reagera" +
    "</button>";
  if (isSelf) {
    menuHTML +=
      '<button class="message-menu-item" data-action="edit">' +
      '<span class="message-menu-icon icon-edit"></span>' +
      "Redigera" +
      "</button>" +
      '<button class="message-menu-item delete" data-action="delete">' +
      '<span class="message-menu-icon icon-delete"></span>' +
      "Ta bort" +
      "</button>";
  }
  menu.innerHTML = menuHTML;
/.../
```
Vi fortsätter med att skapa ett element (bubble, klass: "message-bubble") som vi stoppar in meddelandet i. 

Därefter skapar vi en knapp för menyn och ger den klass och föreberder den för inehåll.

Sedan skapar vi ett element som ska vara för information (`.message-info`) om meddelandet. Vi kommer fylla den med avsändarens namn och tidspunkt för när meddelandet togs emot. Vi skapar sedan elementen för namnet och tidspunkten men vid tillger inte dem till `message-info`-elementet.

Sen skapas menyn, ett element skapas och klassen `"message-menu"` tillges.
Därefter fixas inehållet till menyn, den ändras beroende på ifall `isSelf` är sann eller falsk.
Ifall den är falsk så läggs enbart knappen för att reagera på meddelandet till annars ifall `isSelf` är sann så läggs även möjligheterna att redigera och ta bort meddelandet till i menyn.
Därefter fyller vi på menyn med inehållet.

```javascript
/.../
let reactionContainer = document.createElement("div");
  reactionContainer.className = "reactions";

  let reactionmenu = document.createElement("div");
  reactionmenu.className = "reaction-menu";
  reactionmenu.dataset.id = messageId;

  messageInfo.appendChild(sender);
  messageInfo.appendChild(time);

  contentWrapper.appendChild(avatar);
  contentWrapper.appendChild(bubble);

  messageContainer.appendChild(contentWrapper);
  messageContainer.appendChild(reactionContainer);
  messageContainer.appendChild(reactionmenu);
  messageContainer.appendChild(messageInfo);
  messageContainer.appendChild(menuButton);
  messageContainer.appendChild(menu);

  menuButton.addEventListener("click", function (e) {
    e.stopPropagation();
    toggleMessageMenu(messageId);
  });

  if (isMobile) {
    let longPressTimer;
    messageContainer.addEventListener("touchstart", function () {
      longPressTimer = setTimeout(function () {
        toggleMessageMenu(messageId);
      }, 500);
    });
    messageContainer.addEventListener("touchend", function () {
      clearTimeout(longPressTimer);
    });
    messageContainer.addEventListener("touchmove", function () {
      clearTimeout(longPressTimer);
    });
  }
  const menuItems = menu.querySelectorAll(".message-menu-item");
  for (let i = 0; i < menuItems.length; i++) {
    menuItems[i].addEventListener("click", function (e) {
      e.stopPropagation();
      const action = this.dataset.action;
      handleMenuAction(action, messageId);
    });
  }
  messagesDiv.appendChild(messageContainer);
}
```
Funktionen avslut kommer nu. 
Slutet börjar med att skapa två element, en för reaktions-meyn och en som kommer inehålla reaktionerna. Reaktions-menyn får ett data.id som är meddelandets id för att lätt kunna hitta vilket meddelandet som ska reageras på när en reaktion sker.

Sedan lägger vi till profilbilden och texten i elementet som är runt de.
Därefter stoppar vi in allt som vi har skapat hittills i funktionen in i `messageContainer`.

Vi lägger till en avlyssnare på ifall någon trycker på menyn, ifall de gör de ser vi till att menyn inte stängs direkt då vi har en avlyssnare på att sänga menyr ifall man trycker på dokumentet. `stopPropagation()` ser alltså till att alla händelser på föräldrar element inte kör, menyn öppnar och stängs inte direkt.

Sedan kollar vi ifall användaren är på en mobil, ifall de är de så lägger vi till möjligheten att hålla ner på meddelandet för att öppna menyn, det är för att de inte kan sväva sin mus över element.

Därefter lägger vi till avlyssnare på varje "val" i menyn. Även här använder vi `stopPropagation()`, det är viktigare här då vi inte vill trigga avlyssnarna för menyn när vi trycker på ett alternativ. Vi väljer vad för något vi ska göra med vilken data.action valet har, sedan skickar vi in det och meddelande-id:t in i `handleMenuAction()` för att antingen reagera, redigera eller tar bort meddelandet.

Efter allt detta lägger vi in det nya meddelandet med alla dess finesser in i listan av meddelanden (`messagesDiv`).

**Nu har meddelandet fullbordat sin resa i skapandet i realtid. För att se hur de skapas när konversationen laddas från servern gå till [4.4.2.2](#442-återupptagandet-av-konversationer)**

---
**Server-sidan** `index.js`:
På server-sidan hanteras anslutningar och meddelanden med hjälp av `Socket.IO`.

```js
io.on("connection", (socket) => {
  socket.on("join", (conversationId) => {
    socket.join(conversationId);
    console.log(`User joined conversation ${conversationId}`);
  });

  socket.on("chat", async (data) => {
    const sanitizedMessage = escape(data.msg);
    const messageId = uuidv4();

    await query(
      "INSERT INTO messages (id, conversation_id, sender_id, message) VALUES (?, ?, ?, ?)",
      [messageId, data.conversationId, socket.request.session.userId, sanitizedMessage]
    );

    io.to(data.conversationId).emit("chat", {
      messageId,
      message: sanitizedMessage,
      username: socket.request.session.username,
    });
  });
});
```
---

##### **4.4.1.3 Ta bort meddelanden** 
Att ta bort meddelanden i realtid fungerar väldigt likt att skicka dem men är betydligt enklare då vi enbart behöver ta bort istället för att skapa nytt.

Precis som det förregående avsnittet så sker processen över flera dokument på både klient- och serversidan.

---
```js
function handleMenuAction(action, messageId) {
    const messageContainer = document.querySelector(
      `.message-container[data-id="${messageId}"]`
    );

    /.../

     else if (action === "delete") {
      if (messageContainer) {
        socketClient.emit("deleteMessage", { messageId });
      }
      if (activeMessageMenu) {
        activeMessageMenu.classList.remove("active");
        activeMessageMenu = null;
        activeMessageId = null;
      }
    }
  }
```
Resan för att ta bort meddelanden börjar precis som att skicka meddelanden på klient sidan i `client.js`.
Som tidigare diskuterat i avsnittet [initiering](#4411-initiering) så finns det händelseavlyssnare för varje alternativ i meddelande-menyn. Ifall något alternativ i menyn trycks så körs funktionen `handleMenuAction(action, messageId)`. Vi skickar med vilket alternativ som valdes i menyn med `action` och vilket meddelande det handlar om med `messageID`.

Funktionen börjar med att välja ut vilket meddelandet som har id:t `messageID`, det är för att vi ska kunna hantera den. 

Funktionen kör sedan en if-sats som kör olika kodrader beroende på meny alternativet som valdes, men nu ska vi enbart fokusera på `delete` fallet.

Vi kontrollerar att det faktist finns ett meddelandet med det id:t som skickades med, ifall det finns så skickar vi iväg till servern ett "socket event" med typ "deleteMessage", vi skickar med id:t till meddelanet som ska tas bort.

Därefter stämger vi menyn.

---
```js
socket.on("deleteMessage", async (data) => {
    try {
      const { messageId } = data;

      const [message] = await query(
        `
          SELECT m.sender_id, m.conversation_id 
          FROM messages m
          WHERE id = ?
        `,
        [messageId]
      );

      if (!message || session.userId !== message.sender_id) {
        return;
      }

      await query(`DELETE FROM messages WHERE id = ?`, [messageId]);

      io.to(message.conversation_id).emit("deleteMessage", { messageId });
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  });
```

**Nu fortsätter processen till servern (`index.js`).**

Här lyssnar servern på "socket events" av typen "delteMessage". När det kommer in en händelse här så tas datan emot och en anonym asynkron funktion körs. `messageId` extraheras ur datan. 
Därefter körs en databasförfrågan via `query()` med syfte att få `sender_id` (avsändarens id) och `conversation_id` (konversations id).
De hämtas från meddelande tabellen som vi har döpt till m i förfrågan för att slippa skriva ut hela namnet nrä vi specifierar vilka kolumer vi vill hämta från tabellen. Vi hämtar enbart rader som har samma meddelande `id` som den vi fick med från klienten.

Ifall det inte finns något meddelandet med det id:t eller ifall avsändarens id är inte samma som den som skickade förfrågan att ta bort meddelandet så avbryts processen. Anledningen till att vi verifierar saker på både klient och server sidan är för att minimera onödiga förfrågningar till servern då vi kan stoppa dem redan på klient sidan, men användaren kan manipulera klient koden och därav kan vi inte lita på att den har faktist gjort sitt jobb. Därför måste vi utföra kontroller på både klient- och serversidan.

Ifall kontrollen lyckas går vi vidare till att utföra en till förfrågan till databasan, men nu med syfte att ta bort meddelandet. Det som är viktigt att lägga till märke här är tack vare att vi har deklarerat en `främmande nyckel` för meddelandens id i meddelande reaktions tabellen (visades i [databasstruktur](#32-tabeller)). Det betyder att vi har skapat en relation mellan meddelande tabellen och meddelande reaktions tabellen. Eftersom vi har lagt till `ON DELETE CASCADE` när vi skapade den främmande nyckeln ser vi till att alla reaktioner till meddelandet också tas bort när meddelandet tas bort. Vi vill ju inte att dataabsen ska vara fylld av reaktioner till borttagna meddelanden. Det finns liknande processer för meddelanden i konversationer, användare i konverstaioner, osv. Det är en av många fördelar med att använda en relationsbaserad databas teknologi som SQL ger, till skillnad från andra så som mongoDB.

Vi skickar sedan till alla medlemmar i konversationen att vi ska ta bort ett meddelande och id:t till det meddelandet.

Ifall något går fel i processen fånger vi upp det med `catch(error)` och loggar det i konsolen.

---
```js
socketClient.on("deleteMessage", function (data) {
  const messageContainer = document.querySelector(
    `.message-container[data-id="${data.messageId}"]`
  );
  if (messageContainer) {
    messageContainer.remove();
  }
});
```
**Processen fortsätter tillbaka till klienten i (`client.js`)**
Vi hanterar `"deleteMessage` händelsen med att köra en anonym funktion som hittar meddelandet med samma id som id:t som skickades med. 
Ifall meddelandet finns så tas det bort.

---

##### **4.4.1.4 Redigera meddelanden**

Att redigera meddelanden fungerar ganska likt de två föreegående processer, men har ändå många btydliga skillnader.
Meddelande redigering påbörjar sin resa precis som [att ta bort meddelanden](#4413-ta-bort-meddelanden).

---
```js
else if (action === "edit") {
      const messageBubble = messageContainer.querySelector(".message-bubble");
      const originalMessage = messageBubble.textContent;
      const editInput = document.createElement("textarea");
      editInput.className = "edit-input";
      editInput.value = originalMessage;
      messageBubble.textContent = "";
      messageBubble.appendChild(editInput);
      editInput.focus();
  
     
      editInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          const newMessage = editInput.value.trim();
          if (newMessage) {
            socketClient.emit("editMessage", { messageId, newMessage, conversationId });
            messageBubble.textContent = newMessage;
          } else {
            messageBubble.textContent = originalMessage;
          }
          messageBubble.removeChild(editInput);
        }
      });
```

Redigering börjar med att välja elementet (`.message-bubble`) som inehåller självaste texten i den större meddelande "behållaren".
Sedan extraheras även texten och en ny text-ruta skapas. 
Den extraherade texten stoppas in i text-rutan. Texten tas bort i orginal platsen. 
Därefter stoppas textrutan in där meddelandet nyss var och textrutan väljs (användare kan direkt börja skriva i den utan tat behöva trycka på den) med funktionen `.focus()`.

Därefter läggs en händelseavlyssnare till på textrutan för när användaren trycker på en knapp. Ifall de trycker på enter och inte shift så börjar processen att redigera meddelandet. 

Överflödiga mellanrum tas bort. Ifall det fortfarande finns ett meddelande så skickas en socket händelse iväg till servern av typen "`editMessage`". Det skickas med meddelande-id:t, det nya meddelandet och konversations-id:t.

Men ifall det inte finns något redigerat meddelande återställs texten till orginal behållaren.

efter allt så tas text rutan bort och kvar blir ett meddelande, antingen det gamla eller det nya efter att händelsen har skickats till servern och tagits emot igen.

---
```js
 socket.on("editMessage", async (data) => {
    const { messageId, newMessage, conversationId } = data;
    if (!messageId || !newMessage || !session.userId) {
      console.error("Missing parameters for editMessage:", {
        messageId,
        newMessage,
        userId: session.userId,
      });
      return;
    }
    try {
      const [message] = await query(
        `SELECT sender_id, conversation_id FROM messages WHERE id = ?`, [messageId]);
      if (!message || session.userId !== message.sender_id) {
        return;
      }
      await query(`UPDATE messages SET message = ? WHERE id = ?`, [newMessage, messageId]);
      io.to(conversationId).emit("editMessage", {
        messageId,
        newMessage,
        username: session.username,
      });
    } catch (error) {
      console.error("Error editing message:", error);
    }
  });
```

På servern sidan (`index.js`) så körs dessa kodrader ifall det tas emot en `"editMessage"` händelse.

Meddelande id:t, nya meddelandet och konversations id:t extraheras ur den medskickade datan. Vi gör det med `objektdestrukturering` så vi slipper hantera alla dessa värden som en del av data objektet. Istället för att skriva t.ex. `data.messageID` så räcker det nu att skriva `messageID`.

Ifall någon av de 3 paramatrerna inte finns då avbryts funktionen och vad som saknades loggas i konsolen.

Annars hämtar vi avsändarens id och konversations id:t från meddelanden tabellen på raden som har samma id som det meddelandet som ska redigeras. Ifall det meddelandet inte existerar eller ifall avsändaren inte har samma id som användaren som försöekr redigera meddelandet så avbryts processen. 

När vi kör en förfrågan till databasen när vi vill bara ha en rad så fyller vi `[message]` med svaret. Vi använder [] runt variabeln då vi vill komma åt plats 0 i fältet som svaret från databasen är. Att skriva `[message]` är samma sak som att skriva `message[0]`. Det vi gör kallas för en fält-destrukturering och syftet är att databasen skickar alltid svaret i ett fält även om det är enbart är en rad som hämtas, för att förenkla hanteringen av svaret så tar vi sönder fältet då vi enbart har en rad i svaret till förfrågan.

Annars så uppdaters meddelandet i meddelande tabellen på raden med samma id och en "editMessage" händelse skickas till klienterna som är med i konverstaionen, de får med alla nödvändig data för att redigera meddelandet på deras sida.

---
```js
socketClient.on("editMessage", function (data) {
  const messageContainer = document.querySelector(
    `.message-container[data-id="${data.messageId}"]`
  );
  if (messageContainer) {
    const messageBubble = messageContainer.querySelector(".message-bubble");
    messageBubble.textContent = data.newMessage;
  }
});
```
Tillbaka på klient sidan när den tar emot "editMessage" händelsen från servern (via sockets) så körs denna funktionen.
Den är precis som det vi förklarade innan när användaren redigerar ett meddelandet men nu är fokuset att det ska för de andra deltagarna i konverstaionen också så att även de hänger med på noterna. Vi väljer elementet runt texten i text behållaren med meddelande-id:t vi skickade med och byter ut texten till det nya.

---
---

#### 4.4.2 Återupptagandet av konversationer
När en användare återuptar en konversation så körs mycket på server sidan för att återskapa html för chatten. Varje text behållare, reaktion, osv måste skapas igen. Dessutom måste alla avlyssnare skapas igen på klient-sidan. Mycket av koden är snarlik det som körs för realtids konversationer men den viktigaste skillnaden är nu att vi fyller på med redan existerande data och inte uppdaterar inehållet i realtid.

```js
app.get("/message/:id", message);
```

Processen börjar här, när användaren surfar in på `/message/:id`. Då körs funktionen message som finns i `message.js`. Dess syfte är att återskapa chatten med de förregående chatter och annat på plats, den ska även skapa en ny chatt ifall man försöker skicka ett privat meddelande till någon man än inte har gjort det till.

---

##### 4.4.2.1 message()
```js
async function message(req, res) {
  if (!req.session.loggedIn) {
    return res.redirect("/login");
  }
  const id = req.params.id; 
  const userId = req.session.userId;
  const username = escape(req.session.username);
  try {
   
    let [conversation] = await query(
      `
            SELECT c.id, c.name, c.type
            FROM conversations c
            WHERE c.id = ?
        `,
      [id]
    );

  /.../
```

Message funktionen börjar så här, vi kommer gå genom den del för del då den är väldigt lång. Vi tar in `req` och `res` parametrarna då vi ska returnera något till klienten här (vi ska ge dem html för hur sidan ser ut). Vi tar emot deras förfrågan med `req` och skickar iväg svaret med `res`.

Funktionen börjar med att kontrollera ifall användaren är inloggad, ifall de inte är de som skickas de till inloggningssidan.
Därefter bestämmer vi att `id` ska få värdet av paramteren `id` i sökvägen. Vi bestämde att funktionen körs när någon går till `/message/:id`, där id ska vara ett id av någon användare eller konversation. Kolonet för id betyder att det som kommer efter är en parameter som vi kan hantera i koden via `req.params.id`.
Därefter hämtar vi användar-id:t och användarnamnet (sanatiserar den först). 

Nu är föreberedelserna klara och funktionen kan påbörja. Vi skickar en förfrågan till databasen där vi hämtar id, namn och typ av konversation från konversations tabellen med konversationsId:t av id:t vi skickade med i sökfältet.


```js
if (conversation) {
      members = await query(`
      SELECT cm.user_id 
      FROM conversation_members cm 
      WHERE cm.conversation_id = ?`
      , [conversation.id]);

      let memberOfConversation = false;

      for (let i = 0; i < members.length; i++) {

        if (members[i].user_id == userId) {
          memberOfConversation = true;
        }
      }

      if (memberOfConversation !== true) {
        return res.redirect("/");
      }
    }
```

Vi fortsätter med att kolla ifall en konersation existerar med det id:t. Ifall det finns så börjar vi med att köra en till förfrågan till databasen där vi hämtar användar id:n av alla som är med i konversationen.

Därefter definerar vi `memberOfConversation` och ger standard värdet false. Detta är för att vi sedan loopar genom alla användare i konversationen med syfte att hitta användaren som skickade förfrågan att se chatten. Ifall de inte är en del av konversationen så skickas de tilbaka till startsidan där de kan gå in på en konversation de är en del av.

```js
/.../

if (!conversation) {
      const otherUserId = id;

      [conversation] = await query(
        `
                SELECT c.id, c.name, c.type
                FROM conversations c
                JOIN conversation_members cm1 ON c.id = cm1.conversation_id AND cm1.user_id = ?
                JOIN conversation_members cm2 ON c.id = cm2.conversation_id AND cm2.user_id = ?
                WHERE c.type = 'private'
            `,
        [userId, otherUserId]
      );
      if (!conversation) {
        const [otherUser] = await query(`SELECT username FROM users WHERE id = ?`, [otherUserId]);

        if (!otherUser) {
          return res.send(render("Användaren finns inte."));
        }

        const conversationId = uuidv4();
        const conversationName = escape(otherUser.username);

        /.../
```

Ifall det inte redan finns en konversation så måste vi kontrollera om id:t som skickades med var till en annan person eller inte.
Vi skickar iväg en komplicerad förfrågan till databasen för att kontrollera om det finns en existerande **privat** konversation mellan de två användarna. Vi gör det för att undvika att skapa en till ifall det redan finns en.

Vi fokuserar lite extra på databasförfrågan. Vi vill hämta konversations-ID, namn och typ.

Vi börjar med att hämta alla konversationer från tabellen `conversations`. Därefter kopplar vi ihop den med tabellen `conversation_members`, där vi matchar `conversation_id` mot användare 1 (`userID`).

Detta görs med en `INNER JOIN`, vilket innebär att endast de rader där det finns matchningar i båda tabellerna tas med.

Sedan gör vi en till `INNER JOIN` mot `conversation_members`, den här gången för att filtrera på användare 2. Resultatet blir att vi bara får med konversationer där båda användarna är medlemmar.

Slutligen filtrerar vi med `WHERE c.type = 'private'` för att enbart inkludera privata konversationer (och alltså exkludera t.ex. gruppchattar där användarna också kan finnas tillsammans).

Ifall det inte finns någon privat konversation mellan användarna måste vi skapa en. Vi börjar med att hämta användarnamnet från användaren du vill skapa chatten med. Ifall vi inte hiitar andra användaren så förmedlar vi det till klienten oc havbryter processen.
Sedan förbereder vi parametrar vi ska skicka in i en ny konversation, vi bestämer id:t och sanatiserar användarnamnet.

```js
/.../
  await query(
            `
                      INSERT INTO conversations (id, name, type)
                      VALUES (?, ?, 'private')
                  `,
            [conversationId, conversationName]
          );

          await query(
            `
                      INSERT INTO conversation_members (id, conversation_id, user_id, role)
                      VALUES (?, ?, ?, 'member'), (?, ?, ?, 'member')
                  `,
            [
              uuidv4(),
              conversationId,
              userId,
              uuidv4(),
              conversationId,
              otherUserId,
            ]
          );

          conversation = {
            id: conversationId,
            name: conversationName,
            type: "private",
          };
        }
      }
/.../
```
Vi fortsätter med att skapa konverstaionen i databasen med nödvändig information. Samt lägger vi till användarna som konversations medlemmar i den tabellen också. Därefter definerar vi ett objekt med id, namnet och typen av konversation för att använda när vi renderar den längre fram i processen.

```js
  /.../
    if (conversation) {
        return res.send(
          render(
            await renderChat(conversation, userId, username, req.session.profilePicture)
          )
        );
      }
   
  } catch (error) {
    console.error("Error handling conversation:", error);
    res.send(render("Ett fel uppstod vid hantering av konversation."));
  }
}
```
Vi avslutar `message()` funktionen med att kontrollera att vi har en konversation, antingen en som vi har precis skapat eller en vi har hittat i konversations tabellen. Ifall vi har en så renderar vi till klienten vad funktionen `renderchat()` genererar med all nödvändig information om konversationen. Ifall något gick fel i processen så fångar vi upp det och loggar det i konsolon och förmedlar det till klienten.

Vi tar och följer med processen till `renderchat()`

---

##### 4.4.2.2 renderChat()
```js
async function renderChat(conversation, userId, username, profilePicture) {
    const messages = await query(
      `
        SELECT m.id, m.message, m.sent_at, u.username, u.profile_picture
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = ?
        ORDER BY m.sent_at ASC
      `,
      [conversation.id]
    );
  
    const reactions = await query(
      `
        SELECT r.message_id, r.reaction, GROUP_CONCAT(u.username) AS users, COUNT(*) AS count
        FROM message_reactions r
        JOIN users u ON r.user_id = u.id
        WHERE r.message_id IN (SELECT id FROM messages WHERE conversation_id = ?)
        GROUP BY r.message_id, r.reaction
      `,
      [conversation.id]
    );
  
    let displayName = conversation.name;
    let otherUserProfilePicture = "/images/default_pfp.jpg";

    /.../
```
Vi påbörjar skapandet av html för chatten med att hämta alla meddelanden i konversationen. Vi tar och hänger på användarnamn och profilbild från avsändaren till varje meddelande. Detta görs med en `INNER JOIN`, det hade kunnat användas en `LEFT JOIN` och egentligen borde för att kunna visa de chatter som är från användare som inte finns längre, men eftersom jag kopplar samman medlemmar och meddelanden med `ON DELETE CASCADE` så tas de meddelanden bort ifall användaren tas bort. Men ifall man behöll chatterna så hade det varit bra att då ha en `left join` som lägger till alla meddelanden även om avsändare saknas passat bra. Dock i vårt fall spelar det ingen roll vilken vi använder. `ORDER BY m.sent_at ASC` ser till så att vi får alla meddelande i tidsordning, äldst till sist. Det varför att vi vill rendera de äldsta meddelanden först. Längst upp i chatten finsn det äldsta chatterna och längst ner de nysaste.

Vi vill nu hämta reaktioner på meddeladena.
Vi börjar med att hämta alla rader från tabellen `message_reactions`, där varje rad representerar en specifik användares reaktion på ett meddelande. Därefter kopplar vi på användarinformation från `users`-tabellen för varje reaktion, genom en `INNER JOIN`. Det gör att vi får fram användarnamnet för den som reagerat. Sedan filtrerar vi på alla reaktioner som hör till en viss konversation. Det gör vi genom en **subquery**:
`WHERE r.message_id IN (SELECT id FROM messages WHERE conversation_id = ?)` - det inne i parantesen är en `subquery`

Det betyder att vi bara tar med reaktioner som hör till meddelanden i just den aktuella konversationen.
Efter det grupperar vi reaktionerna med `GROUP BY r.message_id, r.reaction`. Det gör att vi samlar ihop alla reaktioner av samma typ på ett och samma meddelande.
Till exempel: om tre användare har reagerat med "🔥" på samma meddelande, så kommer de tre raderna slås ihop till en.
Vi använder `GROUP_CONCAT(u.username)` för att slå ihop alla användarnamn till en sträng (t.ex. `"Anna, Erik, Moa"`) och `COUNT(*)` för att räkna hur många som lagt just den reaktionen.
Resultatet är alltså en lista där varje rad visar:
 - vilket meddelande det gäller
 - vilken reaktion det är
 - vilka användare som reagerat (som en kommaseparerad sträng)
 - och hur många som gjort det

Avslutningsvis här stoppar vi konversationsnamnet som den som fanns i konversationens namn fält i databasen.
```js
/.../
if (conversation.type === "private") {
      const [otherUser] = await query(
        `
          SELECT u.username, u.profile_picture
          FROM conversation_members cm
          JOIN users u ON cm.user_id = u.id
          WHERE cm.conversation_id = ? AND u.id != ?
        `,
        [conversation.id, userId]
      );
  
      if (otherUser) {
        displayName = otherUser.username;
        otherUserProfilePicture = otherUser.profile_picture || "/images/default_pfp.jpg";
      }
    }
/.../
```

Funktionen forsätter med att deffinera vissa värden som ska vara annorlunda för privata konversationer kontra grupp konversationer.
Det skickas iväg en databasförfrågan för att ta fram användarnamnet och profilbilden av användaren som du skickar meddelanden till i den privata konversationen. Något som man kan lägga märke till här att vi sorterar för de användare som **inte** har samma id som klienten.

Ifall vi hittar någon så sätter vi namnet som visas på toppen av chatten till mottagarens namn och sparar deras profilbild för att skicka med den till meddelanden som de har skickat.

```js
/.../
 let chatHtml = fs.readFileSync("html/chat.html").toString();

    chatHtml = chatHtml.replace(
      '<div id="chat">',
      `<h2 class="name">${escape(displayName)}</h2><div id="chat">`
    );
  
    let messagesHtml = "";
/.../
```

Sedan hämtar vi html mallen från `html/chat.html` samt stoppar in namnet av konversationen på toppen som antingen då mottagrens namn för privata konversationer eller gruppens namn ifall det är en gruppchatt.
Sedan deklareras `messagesHtml` som kommer fyllas med alla meddelandena.

```js
/.../
for (let msg of messages) {
      const messageClass = msg.username === username ? "message-self" : "message-other";
      const messageId = msg.id;
  
      let menuItems =
        '<button class="message-menu-item" data-action="react">' +
        '<span class="message-menu-icon icon-reaction"></span>' +
        "React" +
        "</button>";
  
      if (msg.username === username) {
        menuItems +=
          '<button class="message-menu-item" data-action="edit">' +
          '<span class="message-menu-icon icon-edit"></span>' +
          "Edit" +
          "</button>" +
          '<button class="message-menu-item delete" data-action="delete">' +
          '<span class="message-menu-icon icon-delete"></span>' +
          "Delete" +
          "</button>";
      }
/.../
```
Nu loopar vi genom alla medelanden i `messages` och genererar html för varje medelande. Vi börjar med att kolla ifall meddelandet är skickat av den som är inloggad eller inte. Ifall det är det så får det klassen `message-self` och annars `message-other`. Det är för att vi ska kunna styla meddelanden olika beroende på vem som skickat dem.
Vi skapar även en variabel `messageId` som får värdet av meddelande id:t.
Därefter skapar vi meny knapparna precis som i [4.4.1.2](#4412-skicka-meddelanden).

```js
      /.../
      const messageReactions = reactions.filter((r) => r.message_id === msg.id);
      const reactionsHtml = messageReactions
        .map((r) => {
          const userNames = r.users
            ? r.users
                .split(",")
                .map((user) => escape(user))
                .join(", ")
            : "";
          return `
            <button class="reaction-container" data-emoji="${r.reaction}" title="${userNames}">
              <span class="reaction">${r.reaction}</span>
              <span class="reaction-count">${r.count}</span>
            </button>
          `;
        })
        .join("");
        /.../
```
Vi fortsätter for loopen med att filtrera ut alla reaktioner till det meddelande som vi är på i for loopen. Därefter skapar vi html för alla reaktioner.

Vi går igenom varje reaktion (r) som hör till ett meddelande. Varje r innehåller:
 - `reaction`: själva emojin (t.ex. 🔥)
 - `count`: hur många användare som reagerat med den
 - `users`: en  lista av användarnamn separerad med komma, t.ex. `"Anna,Erik,Moa"`

Vi kollar sedan om det finns användarnamn (`r.users`).
Om det gör det:
1. Delar vi upp strängen i ett fält (`split(",")`)
2. Escapar varje namn för att undvika XSS-attacker (t.ex. `<script>` i ett namn)
3. Slår ihop namnen igen, fast med mellanslag efter kommatecken (`join(", ")`)
Om det inte finns några användare (t.ex. reaktionen saknar avsändare) sätts `userNames` till en tom sträng.

vi returnerar sedan html för varje reaktion med inehåll som fylls av de olika variablerna. Lägg märke till at vi stoppar in användarnamn strängen som en `title` för att när användaren hovrar över reaktionerna ska det synas vilka som har reagerat med den specifika reaktionen.
Varje reaktion generar alltså en egen knapp med inehåll.
Eftersom `map()` ger oss ett fält av HTML-strängar, använder vi `join("")` för att slå ihop allt till en enda HTML-sträng.

```js
      /.../
      messagesHtml += `
        <div class="message-container ${messageClass}" data-id="${messageId}">
          <div class="message-content-wrapper">
            <img src="${msg.profile_picture}" alt="${escape(msg.username)}" class="message-avatar">
            <div class="message-bubble">${msg.message}</div>
            <button class="message-menu-button" aria-label="Message options">
              <span class="icon-dots"></span>
            </button>
          </div>
          <div class="reactions">${reactionsHtml}</div>
          <div class="message-info">
            <span class="message-sender">${escape(msg.username)}</span>
            <span class="message-time">${new Date(msg.sent_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}</span>
          </div>
          <div class="message-menu">${menuItems}</div>
        </div>
      `;
    }
/.../
```
For loopen avslutas med att vi lägger till ett stort tjockt block av html med variabler inpetade överallt för att dynamiskt lägga till inehåll för varje meddelande. Denna html är precis som den som genererades i `displayMessage()` funktionen som förklarades i [4.4.1.2](#4412-skicka-meddelanden).

```js
    chatHtml = chatHtml.replace(
      '<div id="messages" class="hidden">',
      '<div id="messages" class="hidden">' + messagesHtml
    );
    const [membership] = await query(
      ` SELECT pending FROM conversation_members WHERE conversation_id = ? AND user_id = ? `, [conversation.id, userId]);
    if (membership && membership.pending === 1) {
      chatHtml += `
        <script>
          document.getElementById("input").disabled = true;
          document.getElementById("send-button").disabled = true;
        </script>
        <div class="pending-conversation">
          <form action="/accept-conversation" method="POST">
            <input type="hidden" name="conversationId" value="${conversation.id}">
            <button type="submit">Accept</button>
          </form>
          <form action="/decline-conversation" method="POST">
            <input type="hidden" name="conversationId" value="${conversation.id}">
            <button type="submit">Decline</button>
          </form>
        </div>
      `;
    }
    chatHtml += `
      <script>
        const loggedInUsername = "${escape(username)}";
        const conversationId = "${conversation.id}";
        const loggedInPfp = "${profilePicture}";
        const otherUserPfp = "${otherUserProfilePicture}";
      </script>
    `;
    return chatHtml;
  }
```
`renderChat()` funktionen avlsutas nu.
Slutet börjar med att fylla på alla meddelandena som genererades i for-loopen in i `chatHtml` som senare kommer renderas.
Sedan hämtas från databasen ifall användaren har accepterat konversationen ännu eller inte (ifall den är pending eller ej).
Ifall användaren inte har accepterat konversationen ännu läggs det till två knappar för att acceptera eller neka konversationen samt blokeras möjligheten att skicka meddelanden.
Precis innan chatHtml returneras för att renderas så läggs det till en script tag fylld med variabler som användaren kommer dra nytta av på klient sidan. Detta är saker som deas egna användarnamn och profilbild.

Sen är funktionen klar och processen återvänder till `message()` där den renderas och skickas till klienten.
Dock är återupptagandet av konversationen inte helt klar ännu, det behöver fortfarande göras lite på klient-sidan.

---
```js
function initializeChat() {
  messagesDiv.classList.remove("hidden");
  scrollToBottom();
  menuButtonsOldMessages();


  document
    .querySelectorAll(".message-container")
    .forEach((messageContainer) => {
      const messageId = messageContainer.dataset.id;

      
      if (isMobile) {
        let longPressTimer;

        messageContainer.addEventListener("touchstart", function () {
          longPressTimer = setTimeout(function () {
            toggleMessageMenu(messageId);
          }, 500);
        });

        messageContainer.addEventListener("touchend", function () {
          clearTimeout(longPressTimer);
        });

        messageContainer.addEventListener("touchmove", function () {
          clearTimeout(longPressTimer);
        });
      }

      const menuItems = messageContainer.querySelectorAll(".message-menu-item");
      menuItems.forEach((menuItem) => {
        menuItem.addEventListener("click", function (e) {
          e.stopPropagation();
          const action = this.dataset.action;
          handleMenuAction(action, messageId);
        });
      });
    });
}
```
Vi återvänder till `client.js`
`initializeChat()` är inte jätteunik men är en viktig del i puzzlet för att hemsidan ska fungera. 
Korfattatt lägger funktionen till händelse avlyssnare på alla knappar på de gamla meddeladena som har renderats på server sidan. Detta är för att se till så att de fungera precis som de som skapas i realtid med t.ex. reaktioner och redigering.
Lägg märke till början där vi tar bort att alla meddeladena är dolda, detta är för att vi att användaren itne ska se när alla meddeladena skapas och sedan skrollas ner till botten, genom att först visa dem när de har skrollats ner ger en mer smidig användareupplevelse.
Funktionen körs `window.onload = initializeChat;` när hemsidan laddas in. 

---
---
### 4.5. Reaktioner på Meddelanden
En stor del av hemsidan är att man kan reagera på meddeladen. Med hjälp av en smidig meddeladen meny kan man välja att öppna en meny som visar de olika reaktionerna man kan ge ett meddelande. Reaktioner visas prydligt under ett meddelande och ifall man trycker på dem kan man lägga till en eller ta bort en beroende på tidigare reaktioner användaren har gjort. Precis som [Chattfunktionaliteten](#44-chattfunktionalitet) består reaktioner också av två delar, [Reaktioner i realtid](#451-reaktioner-i-realtid) och [Återupptagandet av reaktioner](#452-återupptagandet-av-reaktioner).

---
#### 4.5.1 Reaktioner i realtid
Realtids reaktionerna hoppar mellan server och klienten konstant precis som de andra realtids funktionerna på hemsidan.
Vi börjar resan i `client.js`

##### 4.5.1.1 Skicka reaktioner

```js
function handleMenuAction(action, messageId) {
    const messageContainer = document.querySelector(
      `.message-container[data-id="${messageId}"]`
    );
  
    if (action === "react") {
      showReactionPicker(messageId);
```
När användaren trycker på "`react`"-alternativet i meddelandemenyn  så körs `showReactionPicker()` och vi skickar med id:t till meddelandet som vi vill öppna reaktions menyn på.

---
```js
function showReactionPicker(messageId) {
  const messageContainer = document.querySelector(
    `.message-container[data-id="${messageId}"]`
  );
  if (messageContainer) {
    const rect = messageContainer.getBoundingClientRect();
    reactionPicker.style.top = `${rect.top - 50}px`;
    reactionPicker.style.left = `${rect.left + rect.width / 2}px`;

    reactionPicker.classList.add("active");

  
    const emojis = reactionPicker.querySelectorAll(".reaction-emoji");
    for (let i = 0; i < emojis.length; i++) {
      emojis[i].onclick = function (e) {
        e.stopPropagation();
        const emojiValue = this.dataset.emoji;
        handleReaction(emojiValue, messageId);
      };
    }

 
    if (activeMessageMenu) {
      activeMessageMenu.classList.remove("active");
      activeMessageMenu = null;
      activeMessageId = null;
    }
  }
}
```
Funktionen börjar med att hitta meddelande behållaren med just det id:t vi skickade med, ifall den finns så körs resten av koden.
Vi hämtar den exakta positionen och storleken av meddelande behållaren med `getBoundingClientRect()`. Funktionen returnerar ett objekt med bl.a `top`, `left`, `width`, `height`. Det är värden som förklarar var elementet är på skärmen och hur stort det är. Vi kan då stoppa reaktions väljaren 50px högre än meddelandet med `${rect.top - 50}px` och stoppar den halvägs över meddelandet med `${rect.left + rect.width / 2}px` (medelandets vänster kant (`rect.left`)) och lägger till halva bredden av meddelandet (`rect.width / 2)`). Detta görs för att förflytta reaktionsväljaren till det aktiva meddelandet då det enbart finns en reaktionsväljare på hemsidan och inte en för varje meddelande.

Vi gör sedan reaktions väljaren aktiv och då visas den. Vi lägger till händelse lyssnare för varje individuell emoji i reaktionsväljaren. De kör då funktionen `handleReaction(emojiValue, messageId)` när de trycks på. De får `emojiValue` från `data-emoji = ""` som finns med i varje individuell emoji.

Vi ser också till att stänga meddelandemenyn.

---
```js
function handleReaction(emoji, messageId) {
  const messageContainer = document.querySelector(
    `.message-container[data-id="${messageId}"]`
  );
  const reactionContainer = messageContainer.querySelector(
    `.reaction-container[data-emoji="${emoji}"]`
  );

  if (reactionContainer) {
    const reactionIds = reactionContainer.dataset.reactionIds.split(" ");
    const userHasReacted = reactionIds.some((id) => id === loggedInUsername); 
    if (userHasReacted) {
  
      socketClient.emit("deleteReaction", { emoji, messageId, conversationId });
    } else {
      socketClient.emit("react", { emoji, messageId, conversationId });
    }
  } else {
    socketClient.emit("react", { emoji, messageId, conversationId });
  }

  reactionPicker.classList.remove("active");
}
```
Funktionen `handleReaction()` ansvarar för att skicka iväg reaktionen eler ta bort/redigera den.
Funktionen försöker hämta reaktionen på det specifika meddelandet med den specifika emojin. Ifall någon redan har reagerat på det meddelandet med samma emoji så kommer `reactionContainer` att finnas. Då delar vi upp användarnamnen av de som har reagerat på meddelandet till ett fält. Vi går sedan genom fältet med `some()` som letar ifall den hittar ett värde i fältet som matchar användarnamnet av användaren. Some returnerar antingen falskt eller sant och returnerar sant så fort den har hittat ett fall som stämmer och avbryter sökandet då.

Ifall användaren redan har reagerat på meddelandet så körs socket händelsen `deleteReaction` som kommer diskuteras mer i ["Ta bort reaktioner"](#4512-ta-bort-reaktioner).

Annars ifall användaren inte har reagerat på meddelandet med den reaktion eller ifall ingen har reagerat på meddelandet ännu skickas det iväg en socket händelse till servern av typen `react`. Det skickas med emojin, meddelande-id:t och konversations id:t.

---
```js
socket.on("react", async (data) => {
    const { emoji, messageId, conversationId } = data;

    if (!emoji || !messageId || !session.userId || !session.username) {
      console.error("Missing parameters for react:", {
        emoji,
        messageId,
        userId: session.userId,
        username: session.username,
      });
      return;
    }
    const reactionId = uuidv4();
    try {
      const [existingReaction] = await query(
        `
                    SELECT id FROM message_reactions
                    WHERE message_id = ? AND user_id = ? AND reaction = ?
                `,
        [messageId, session.userId, emoji]
      );
      if (existingReaction) {
        console.error("Reaction already exists:", {
          emoji,
          messageId,
          userId: session.userId,
        });
        return;
      }
      await query(
        `INSERT INTO message_reactions (id, message_id, user_id, reaction) VALUES (?, ?, ?, ?)`,
        [reactionId, messageId, session.userId,emoji]);

      io.to(conversationId).emit("react", {reactionId, messageId, userId: session.userId, username: session.username, emoji,});
    } catch (error) {
      console.error("Error saving reaction:", error);
    }
  });
```
`index.js`
På servern när `react` händelsen sker så körs detta.
Vi kontrollerar att alla paramterar skickades med och ifall inte så avbryts allt.
Därefter kontrolleras det ifall reaktionen redan finns. Ifall inte så läggs den till i databasen i `message_reactions`-tabellen.
Sedan skickas händelsen tillbaka till klienterna med i konversationen och de nödvändiga parametrarna skickas med.

---
```js
socketClient.on("react", function (data) {
  const messageContainer = document.querySelector(
    `.message-container[data-id="${data.messageId}"]`
  );
  if (messageContainer) {
    const reactionContainer = messageContainer.querySelector(
      `.reaction-container[data-emoji="${data.emoji}"]`
    );
    if (reactionContainer) {
     
      const countSpan = reactionContainer.querySelector(".reaction-count");
      countSpan.textContent = parseInt(countSpan.textContent) + 1;
      reactionContainer.title += `, ${data.username}`;
    } else {
      
      const newReaction = document.createElement("button");
      newReaction.className = "reaction-container";
      newReaction.dataset.emoji = data.emoji;
      newReaction.title = data.username;
      newReaction.innerHTML = `
                <span class="reaction">${data.emoji}</span>
                <span class="reaction-count">1</span>
            `;
      messageContainer.querySelector(".reactions").appendChild(newReaction);
    }
  }
});
```
`client.js`
Tillbaka på klientsidan tar vi emot `react`-händelsen och kör en funktion.
Vi kontrollerar ifall det finns en reaktion av samma typ ännu på meddelandet. Ifall det finns då ökar vi siffran av antal reaktioner av den typen med 1 och vi lägger till namnet av den som har reagerat i titlen på reaktionen (visas när man hovrar).

Ifall ingen har lagt en reaktion av den typen ännu skapas en.

---

##### 4.5.1.2 Ta bort reaktioner

```js
if (userHasReacted) {
      
      socketClient.emit("deleteReaction", { emoji, messageId, conversationId });
```
`client.js`
Som jag visade i [avsnittet om att skicka reaktioner i realtid](#4511-skicka-reaktioner) så lyssnar vi på när en klient trycker på en reaktion eller skickar en till. Ifall de redan har lagt en reaktion av samma typ så tar vi bort den. Vi skickar en `deleteReaction` händelse till servern.

---
```js
await query(`DELETE FROM message_reactions WHERE id = ?`, [reaction.id]);
```
`index.js`
Att ta bort en reaktion är exakt samma kod som att lägga till en förutom en liten skillnad. Istället för att lägga till en reaktion i databasen tar vi bort den istället för `delteReaction`

---
```js
socketClient.on("deleteReaction", function (data) {
  const messageContainer = document.querySelector(
    `.message-container[data-id="${data.messageId}"]`
  );
  if (messageContainer) {
    const reactionContainer = messageContainer.querySelector(
      `.reaction-container[data-emoji="${data.emoji}"]`
    );
    if (reactionContainer) {
      const countSpan = reactionContainer.querySelector(".reaction-count");
      const newCount = parseInt(countSpan.textContent) - 1;
      if (newCount <= 0) {
        reactionContainer.remove();
      } else {
        countSpan.textContent = newCount;
        reactionContainer.dataset.reactionIds =
          reactionContainer.dataset.reactionIds
            .split(" ")
            .filter((id) => id !== data.reactionId)
            .join(" ");
        reactionContainer.title = reactionContainer.title
          .split(", ")
          .filter((name) => name !== data.username)
          .join(", ");
      }
    }
  }
});
```
Att ta bort en reaktion är simpelt på klient-sidan också. Vi hittar bara upp reaktionen och sedan hittar räknaren av hur många reaktioner har skett. Vi minskar antalet med 1 och ifall den då når 0 så tar vi bort den reaktions typen. Ifall det finns kvar reaktioner från andra användare av den typen så filtrerar vi bort användarnamnet och reaktions-id:t från dess platser i reaktionen.

#### 4.5.2 Återupptagandet av reaktioner
Huvuddelen av återupptagandet av reaktioner förklaras redan i [avsnittet om återupptagandet av chatter](#4422-renderchat). Då avsnitt 4.4.2.2 redan förklarar skapandet av html för reaktioner ska detta avsnitt förklara hur händelshanterare läggs till på gamla reaktioner.

---
```js
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("reaction-container")) {
    let messageId = e.target.closest(".message-container").dataset.id;
    let emoji = e.target.dataset.emoji;
    let title = e.target.title; 

    if (emoji) {
    
      const userHasReacted = title.split(", ").includes(loggedInUsername);

      if (userHasReacted) {
       
        socketClient.emit("deleteReaction", {
          emoji,
          messageId,
          conversationId,
        });
      } else {
       
        socketClient.emit("react", { emoji, messageId, conversationId });
      }
    }
  }
});
```

Här läggs det till en händelsehanterare för hela dokumentet men filtrerar bort alla fall där användaren inte trycker på en reaktions behållare. Ifall användaren har tryckt på en reaktions behållare så hittas meddelande-id:t med hjälp av `closest()`-funktionen. `closest()` returnerar det närmsta föräldrar-element som i detta fall inehåller klassen `message-container`. Det är användbart när det finns element inbäddade i andra.

Därefter utförs en kontroll ifall användarens namn är en del av det fält som skapas av reaktörerna. Ifall användaren är en av de som tidigare har reagerat med samma emoji på meddelandet tas deras reaktion bort. Annars läggs det till en av samma typ.

---
```js
const reactionPicker = document.getElementById("reaction-picker");
reactionPicker.addEventListener("click", handleReactionPickerClick);
```

Reaktionsväljaren hämtas och det läggs till en händelsehanterare för ifall den trycks på. När den trycks på körs `handleReactionPickerClick` som förklaras i detalj i [avsnittet om reaktioner i realtid](#4511-skicka-reaktioner).

---
---

### 4.6. Konversationshantering
Användarens olika konversationer visas på förstasidan, samt visas ett formulär för att skapa nya konversationer, både privata och grupp.
Konversationerna sorteras in i två olika grupper, accepterade konversationer och väntande konversationer. De konversationer användaren har accepterat visas under accepterade konversationer medans de som användaren ännu inte har accepterat visas uner väntande konversationer. Systemet är till för att skydda användaren från oönskade meddelanden. Ifall användaren inte vill ta del av en konversation som de har blivit förfrågad att gå med i väljer de enkelt att neka förfrågan. De kan förhandsvisa konversationen innan de väljer att acceptera eller neka för tat få förståelse vad för slags konversation det är.

Först kommer det förklaras [hur konversationerna renderas](#461-rendering-av-konversationer) på första sidan och därefter kommer det förklaras hur användaren kan [skapa](#462-skapandet-av-konversationer) och [neka/acceptera konversationer](#463-hanterandet-av-konversationsförfrågningar).

---
#### 4.6.1 Rendering av konversationer
```js
app.get("/", getConversations);

async function getConversations(req, res) {
  if (!req.session.loggedIn) {
    return res.redirect("/login");
  }

  try {
    const userId = req.session.userId;

  
    const conversations = await query(
      `
          SELECT c.id, c.name, c.type
          FROM conversations c
          JOIN conversation_members cm ON c.id = cm.conversation_id
          WHERE cm.user_id = ? AND cm.pending = 0
        `,
      [userId]
    );

    
    const pendingConversations = await query(
      `
          SELECT c.id, c.name, c.type
          FROM conversations c
          JOIN conversation_members cm ON c.id = cm.conversation_id
          WHERE cm.user_id = ? AND cm.pending = 1
        `,
      [userId]
    );
  /.../
```
När användaren går in på startsidan `/` så körs `getConversations`-funktionen för att tilldela html-koden för startsidan. Funktionen förklaras del för del.

Funktionen börjar med en kontroll av att användaren är inloggad. Därefter hämtar den användar-id:t från användarens session `req.session.userID`.
Därefter hämtas all konversationer från `conversations`-tabellen som användaren tillhör och är av typen redan accepterad.
Sedan körs nästan samma förfrågan igen men för alla konversationer som användaren **inte** har accepterat.

```js
/.../
    let html = `<div class="users">`;
    html += `<h3>Konversationer</h3>`;
    for (let convo of conversations) {
      let displayName = "Unknown Conversation";
      let profilePicture = "/images/default_pfp.jpg";
      let latestMessage = "No messages yet";

      if (convo.type === "private") {
        const [otherUser] = await query(
          `
              SELECT u.username, u.profile_picture
              FROM conversation_members cm
              JOIN users u ON cm.user_id = u.id
              WHERE cm.conversation_id = ? AND u.id != ?
            `,
          [convo.id, userId]
        );
        if (otherUser) {
          displayName = otherUser.username;
          profilePicture =
            otherUser.profile_picture || "/images/default_pfp.jpg";
        }
      } else if (convo.type === "group") {
        displayName = convo.name;
        profilePicture = "/images/group_pfp.jpg";
      }
      const [message] = await query(
        `
            SELECT message
            FROM messages
            WHERE conversation_id = ?
            ORDER BY sent_at DESC
            LIMIT 1
          `,
        [convo.id]
      );
      if (message) {
        latestMessage = message.message;
      }
      html += `
          <a href="/message/${convo.id}" class="user">
            <img src="${profilePicture}" alt="PFP" width="50" height="50">
            <span>${displayName}</span>
            <p>${latestMessage}</p>
          </a>
        `;
    }
/.../
```
Funktionen fortsätter med att börja skapa html. Början av ett div element med klassen users skapas, med syfte att fyllas av konversationerna användaren har accepterat och sedan avslutas när elementet är "påfylld".

Sedan i en forr loop skapas html för varje individuell konversation användaren är med i av typen accepterad. Standard värden sätts och konversations namnet sätts på samma sätt som i [avsnittet om återupptagandet av konversationer](#4421-message)

Sedan väljs det senaste meddelandet i konverstaionen ut med en förfrågan till databasen. `ORDER BY sent_at DESC` ser till att meddelandena är sorterade nyast till senast, därefter begränsar `LIMIT 1` antalet meddelanden till 1 (Den senaste). Sedan genereras html för de individuella konversationerna med den data som har bestämts i for-loopen. 

Tillslut så har `html`-variabeln fyllts med alla konversationer användaren är del av av typen accepterad.

---
```js
/.../
<div class="actions">
      <a href="/message/${convo.id}">View</a>
      <form action="/decline-conversation" method="POST" style="display:inline;">
        <input type="hidden" name="conversationId" value="${convo.id}">
        <button type="submit">Decline</button>
      </form>
      <form action="/accept-conversation" method="POST" style="display:inline;">
        <input type="hidden" name="conversationId" value="${convo.id}">
        <button type="submit">Accept</button>
      </form>
    </div>
/.../
```
Funktionen forsätter med att köra nästan samma kod igen fats nu för konversationer som inte har accepterats ännu. Den största skillnaden är att det läggs till knappar för att förhandsvisa konversationen, acceptera den och neka den. Alla konversationer stoppas även i ett nytt element för att särskyllja accepterade och icke accepterade konversationer.

```js
/.../
 html += `</div>`;

    html+= await getConversationForm();
    res.send(render(html));
```
Funktionen avslutas med att stäng users elementet och lägga till html som `getConversationForm` har genererat.

---
```js
async function getConversationForm() {
  try{
    const users = await query("SELECT id, username FROM users");

    const userCheckboxes = users.map(user => `
      <div class="user-item">
        <label>
          <input type="checkbox" name="users" value="${user.id}" />
          ${user.username}
        </label>
      </div>
    `).join("");
  
    return `
    <div class="form-container">
      <h2>Create Conversation</h2>
      <form id="conversationForm">
        <input type="text" id="searchInput" placeholder="Search users..." class="search-input" />
  
        <div id="userList" class="user-list">
          ${userCheckboxes}
        </div>
  
        <div id="conversationNameGroup" class="form-group hidden">
          <input type="text" id="conversationName" name="conversationName" class="search-input" />
          <label for="conversationName">Conversation Name:</label>
        </div>
  
        <button type="submit" id="conversationCreatorButton">Create</button>
      </form>
    </div>
  
    `;
  }
  catch (error) {
    console.error("Error fetching users: ", error);
  }
}
```
`getConversationForm` börjar med att hämtar alla användare på hemsidan och sedan generera html för varje användare med en `map()`. Notera tat varje användare är en `checkbox` med ett värde av användarens `id`. Detta är för att användaren ska kunna trycka i vilka personer de vil ha en konversation med.

Sedan returnerar funktionen html för hela formuläret med användarna inklisstrade i mitten. Notera att det finns en konversationsnamn fält som ska fyllas i för grupper men inte för privata konversationer, därför visas den inte av standard men aktiveras så fort användaren väljer mer än 1 person att prata med.

---
#### 4.6.2 Skapandet av konversationer
För att skapandet av konversationer ska genomföras på ett smidigt sätt finns det klient script som anpassar formuläret medans anvädaren fyller i den.
```js
var socketClient = io("https://tjatta.xyz");
const searchInput = document.getElementById("searchInput");
const userList = document.getElementById("userList");
const conversationNameGroup = document.getElementById("conversationNameGroup");

function filterUsers() {
  const filter = searchInput.value.toLowerCase();
  const items = userList.querySelectorAll(".user-item");
  items.forEach((item) => {
    const name = item.textContent.toLowerCase();
    item.style.display = name.includes(filter) ? "" : "none";
  });
}

function updateConversationNameVisibility() {
  const selected = userList.querySelectorAll("input[type='checkbox']:checked");
  conversationNameGroup.classList.toggle("hidden", selected.length <= 1);
}

searchInput.addEventListener("input", filterUsers);
userList.addEventListener("change", updateConversationNameVisibility);

const conversationForm = document.getElementById("conversationForm");
const conversationCreatorButton = document.getElementById("conversationCreatorButton");
/../
```
`homePage.js` ser till att formuläret fungerar felfritt.
`filterUsers()` syfte är att sortera vilka användare som visas medans man söker efter en specifik. När användaren skriver i sökrutan så sorteras det ut vilka konton som har den sträng användaren skriver in i sit namn.
Funktionen börjar med att ta värdet av vad som användaren har skrivit in och omvandlar det till små bokstäver för att undvika skiftlägeskänsliget. Sedan väljs ut alla konton och för varje konto omvandlas deras namn till små bokstäver. Sedan anpassas utseendet för dem beroende på ifall deras namn inehåller det användaren har matat in i sökfältet. Ifall de inehåller namnet så får de forsättas att visas men ifall de inte gör det så läggs det till `display: none` på elementen och de slutas att visas.

Funktionen `updateConversationNameVisibility()` ser till att ifall mer än ett konto har valts att kovnersationsnamns textrutan visas.

Sedan läggs till händelsehanterare för när någon söker på ett konto och när någon väljer konton. Då körs de respektive funktionerna som precis deffinerades.

```js
conversationForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const selectedUsers = Array.from(
    document.querySelectorAll("input[name='users']:checked")
  ).map((checkbox) => checkbox.value);

  const conversationName = document
    .getElementById("conversationName")
    .value.trim();

  if (selectedUsers.length === 0) {
    alert("Välj minst en användare.");
    return;
  }

  socketClient.emit("createConversation", {
    users: selectedUsers,
    conversationName: selectedUsers.length > 1 ? conversationName : null,
  });
});
socketClient.on("createConversation", (data) => {
  window.location.href = `/message/${data.conversationId}`;
});
```
`homepage.js` avslutas med att en händelsehanterare läggs till på skicka-knappen.
Ifall någon trycker på skicka knappen så ser vi till att sidan inte laddas om med `e.preventDefault();`. `e` är händelse objektet som inehåller information om händelsen, den informationen kan användas för att bland annat avbryta det vanliga beteendet av händelsen. `submit` händelsens standard beteende är att skicka iväg datan och ladda om sidan, men eftersom vi vill skicka datan via sockets och inte ladda om hemsidan stoppar vi detta beteende och på så sätt undviker att användaren laddar om sidan.

Sedan omvandlas alla valda kryssrutor till deras värde i ett fält. Konversationsnamnet hämtas och onödiga mellanrum tas bort. Ifall ingen användare har valts så avbryts processen och felet meddelas till användaren.

Sedan skickas en socket händelse till servern av typen `createConversation`. Vi döper om parametrarna till users och conversationName. Ifall antalet användare som valdes är mer än 1 så blir namnet på konversationen till det som matades in i textrutan annars sätts namnet till `NULL`.


---
```js
 socket.on("createConversation", async (data) => {
   if (!session.loggedIn) {
      res.redirect("/login");
      return;
    }

    const { users, conversationName } = data;
    
    if (!Array.isArray(users) || users.length === 0) {
      socket.emit("createConversation", { error: "Invalid user selection." });
      return;
    }
    try {
      const creatorId = session.userId;

      if (!users.includes(creatorId)) {
        users.push(creatorId);
      }
    let conversationId;
```
Servern börjar vid händelsen att köra validering på datan som skickades med genom att bland annat kontrollera att användarna är faktist i ett fält så att den kan hantera det som ett fält utan problem.

Därefter läggs skaparens id till i listan av konversationens användar-id:n.

```js  
      if (users.length === 2) {
        const [existingConversation] = await query(
          `
          SELECT c.id
          FROM conversations c
          JOIN conversation_members cm1 ON c.id = cm1.conversation_id AND cm1.user_id = ?
          JOIN conversation_members cm2 ON c.id = cm2.conversation_id AND cm2.user_id = ?
          WHERE c.type = 'private'
          `,
          [creatorId, users.find((userId) => userId !== creatorId)]
        );
  
        if (existingConversation) {
          conversationId = existingConversation.id;
        } else {
          conversationId = uuidv4();
          await query(
            `
            INSERT INTO conversations (id, name, type)
            VALUES (?, 'private', 'private')
            `,
            [conversationId]
          );
          await query(
            `
            INSERT INTO conversation_members (id, conversation_id, user_id, role, pending)
            VALUES (?, ?, ?, 'member', 0), (?, ?, ?, 'member', 1)
            `,
            [
              uuidv4(),
              conversationId,
              creatorId,
              uuidv4(),
              conversationId,
              users.find((userId) => userId !== creatorId),
            ]
          );
        }
        /.../
}
```
Sedan körs koden för ifall det ska skapas en privat konversation (bara två användaren, skaparen och en till). Det kontrolleras ifall det redan finns en existerande konversation mellan de två användarna( Förklaras i [avsnittet om återupptagandet av konversationer](#4421-message)), ifall det gör det stoppas konversations id:t till det id som den existerande konversationen har. 

Men ifall det inte finns en existerande konversation så skapas en där skaparen har accepterat konversationen men motagaren inte har.

```js
} else {
        
        conversationId = uuidv4();
        await query(
          `
          INSERT INTO conversations (id, name, type)
          VALUES (?, ?, 'group')
          `,
          [conversationId, escape(conversationName)]
        );
  
        const memberValues = users
          .map((userId) =>
            userId === creatorId
              ? `('${uuidv4()}', '${conversationId}', '${userId}', 'member', 0)`
              : `('${uuidv4()}', '${conversationId}', '${userId}', 'member', 1)`
          )
          .join(", ");
  
        await query(
          `
          INSERT INTO conversation_members (id, conversation_id, user_id, role, pending)
          VALUES ${memberValues}
          `
        );
      }
  
      users.forEach((userId) => {
        socket.to(userId).emit("join", conversationId);
      });

      socket.emit("createConversation", { conversationId });
    
  });
```
Ifall det istället ska skapas en grupp konversation så körs den ovanstående koden.
Konversationen skapas med ett nytt konverationsid och namnet som gavs innan i formuläret.
Sedan för varje användare så skapas värdena som ska in i tabellen `conversation_members`. Det görs med en map där ifall användaren har samma id som skaparen så blir deras status att de har accepterat konversationen medans alla andra användarna får statuset att de inte har accepterat den. Alla värdena blir inom paranteser och skilljs med komma tecken, precis som syntaxen kräver i SQL. 

Tillslut skickas det till alla medlemmar att de går med i konversationen och atta konversationen har skapats skickas också.

När klienten tar emot att konversationen har skapats så skickas de till den med `window.location.href = `/message/${data.conversationId}`;` i `homePage.js`.

---
#### 4.6.3 Hanterandet av konversationsförfrågningar
När en användare möts av två val vid en konservationsförfrågan, att acceptera eller neka.

---
##### 4.6.3.1 Nekandet av en konservationsförfrågan
```js
app.post("/decline-conversation", async (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect("/login");
  }

  const { conversationId } = req.body;
  const userId = req.session.userId;

  try {
    await query(
      `
          DELETE FROM conversation_members
          WHERE conversation_id = ? AND user_id = ?
        `,
      [conversationId, userId]
    );

    res.redirect("/");
  } catch (error) {
    console.error("Error declining conversation:", error);
    res.send(render("Ett fel uppstod vid att avböja konversationen."));
  }
});
```
När en användare nekar en konsversationsförfrågan så skickar de en post-förfrågan till /decline-conversation via fromuläret som skapades i [avsnittet om gamla meddelanden](#4421-message) när användaren förhansvisar en konversation, eller i [asnittet om skapandet av konservations html för framsidan](#46-konversationshantering).

Konservations-id:t tas emot från formuläret och anvädnar id:t från sessionen. Därefter skickas en förfrågan till databasen för att ta bort användaren från konversationen. Det sker genom att ta bort raden som säger användaren är en del av konversationen i `conversation-members` tabellen.

---
##### 4.6.3.2 Accepterandet av en konservationsförfrågan
```js
app.post("/accept-conversation", async (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect("/login");
  }

  const { conversationId } = req.body;
  const userId = req.session.userId;

  try {
    await query(
      `
          UPDATE conversation_members
          SET pending = 0
          WHERE conversation_id = ? AND user_id = ?
        `,
      [conversationId, userId]
    );

    res.redirect("/");
  } catch (error) {
    console.error("Error accepting conversation:", error);
    res.send(render("Ett fel uppstod vid att acceptera konversationen."));
  }
});
```
Atta acceptera en konversation sker på exakt samma sätt som att [neka en konversation](#4631-nekandet-av-en-konservationsförfrågan), men istället för att ta veck användaren från konversationen uppdateras användarens status till att de har accepterat konversationen.

---
---

## 5. Installation och Körning

En demonstration av projektet körs på `https://tjatta.xyz`.
Ifall den inte finns tillgänglig, följ dessa steg:

1. Klona projektet från https://github.com/Sniffo5/GymnasieArbetePublik
2. Installera beroenden med `npm i`
3. Konfigurera databasen, detta gör du med att skapa en .env fil där du fyller på med
  - DB_HOST=''
  - DB_USER=''
  - DB_PASSWORD=''
  - DB_NAME=''
  För att kunna göra detta så måste du starta en mySQL databas, du kan t.e.x göra detta lokalt eller online på t.ex. clever-cloud.com (erbjuder gratis databas hosting). Du behöver bara återskapa tabellerna med SQL-koden som visas i [Övrigt](#8-övrigt).
4. starta servern med `npm start`


## 6. Säkerhet

 - Lösenordshashning med bcrypt: Säkerställer att lösenord lagras som hashade värden, vilket gör dem svåra att återskapa även om databasen läcker.
 - Sanering av användarinmatning med `escape-html`: Förhindrar XSS-attacker genom att omvandla farliga tecken i användarinmatning till ofarliga HTML-entiteter.
 - Skydd från SQL-injections: Använder parametriserade SQL-frågor för att förhindra att databasen manipuleras.
 - Användning av sessionshantering: Säkerställer att användarsessioner är autentiserade och skyddade med cookies som inte kan manipuleras av klienten.

## 7. Framtida Utveckling

- Lista över potentiella förbättringar och nya funktioner:


  - **Validering av att användaren är den som faktiskt skickar iväg en reaktion på serversidan**
   Förbättring: Implementera en kontroll på serversidan som säkerställer att användaren som skickar en reaktion är en del av konversationen och har rätt att interagera med meddelandet. Detta kan göras genom att kontrollera användarens `userId` mot `conversation_members`-tabellen innan reaktionen sparas eller tas bort.

    **Fördelar**:
      - Förhindrar att obehöriga användare manipulerar reaktioner via direktanrop till servern.
      - Ökar säkerheten och dataintegriteten i applikationen.

  - **Justering av reaktionsväljaren för att centrera den exakt över meddelandet**
   Förbättring: Förbättra positioneringen av reaktionsväljaren genom att subtrahera halva bredden av väljaren från dess vänsterposition (`left`). Detta kan göras genom att beräkna bredden med `reactionPicker.offsetWidth`.

    **Fördelar**:
      - Ger en mer exakt och estetiskt tilltalande placering av reaktionsväljaren.
      - Förbättrar användarupplevelsen, särskilt på mindre skärmar.

  - **Optimering av getConversations-funktionen**
   Förbättring: Slå ihop de två SQL-frågorna för accepterade och väntande konversationer till en enda fråga. Lägg till en kolumn som indikerar om konversationen är accepterad eller inte (pending). Därefter kan du använda en enda for-loop för att sortera och rendera konversationerna. Samt kombinera logiken för att hämta och rendera konversationer i en enda loop. Lägg till en kontroll i loopen för att skilja mellan accepterade och väntande konversationer baserat på pending-statusen.

    **Fördelar**:
      - Minskar antalet databasförfrågningar, vilke kan förbättra prestandan.
      - Reducerar redundans i koden.
      - Gör koden mer läsbar och underhållsvänlig.

  - **Förbättra hanteringen av felmeddelanden**
   Förbättring: Implementera en centraliserad felhanteringsmekanism för både klient- och serversidan. Använd en middleware för att fånga upp och logga fel på serversidan och visa användarvänliga felmeddelanden på klientsidan. Middlewaret hade loggat fel i konsolen samt skickat felet till klienten via ett socket event så att de får reda på felet i realtid.

    **Fördelar**:
      - Gör applikationen mer robust och användarvänlig.
      - Underlättar felsökning och loggning.

   - **Responsiv design och mobilanpassning**
   Förbättring: Förbättra användarupplevelsen på mobila enheter genom att optimera CSS och layouten för mindre skärmar. Lägg till stöd för gester, som svep för att ta bort meddelanden eller öppna menyer. Många problem uppstår idag vid använding av mobila enheter.

    **Fördelar**:
      - Gör applikationen mer tillgänglig för användare på mobila enheter.

   - **Implementera rollbaserad åtkomstkontroll**
   Förbättring: Lägg till stöd för olika roller i konversationer, som administratörer och medlemmar. Administratörer kan ha särskilda rättigheter, som att lägga till eller ta bort medlemmar.

    **Fördelar**:
      - Gör applikationen mer flexibel och användbar för gruppkonversationer.
      - Ökar säkerheten genom att begränsa åtkomst till vissa funktioner.

Dessa förbättringar skulle inte bara göra applikationen mer robust och användarvänlig, utan också förbereda den för framtida skalning och nya funktioner.

 ## 8. Övrigt

 **SQL kommandon för att återskapa databasen:**

```SQL
START TRANSACTION;

CREATE DATABASE IF NOT EXISTS `s129691_test` DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci;
USE `s129691_test`;

CREATE TABLE `conversations` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('private','group') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

CREATE TABLE `conversation_members` (
  `id` char(36) NOT NULL,
  `conversation_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `role` enum('admin','member') NOT NULL,
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `pending` tinyint(1) NOT NULL DEFAULT 1
) DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

CREATE TABLE `messages` (
  `id` char(36) NOT NULL,
  `conversation_id` char(36) NOT NULL,
  `sender_id` char(36) NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `message_type` enum('text','image') NOT NULL,
  `status` enum('sent','delivered','read') NOT NULL,
  `sent_at` timestamp NOT NULL DEFAULT current_timestamp()
) DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

CREATE TABLE `message_reactions` (
  `id` char(36) NOT NULL,
  `message_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `reaction` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `reacted_at` timestamp NOT NULL DEFAULT current_timestamp()
) DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

CREATE TABLE `users` (
  `id` char(36) NOT NULL,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `profile_picture` varchar(255) DEFAULT '/default_pfp.jpg',
  `status` enum('online','offline') NOT NULL DEFAULT 'offline'
) DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;


ALTER TABLE `conversations`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `conversation_members`
  ADD PRIMARY KEY (`id`),
  ADD KEY `conversation_id` (`conversation_id`),
  ADD KEY `user_id` (`user_id`);

ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `conversation_id` (`conversation_id`),
  ADD KEY `sender_id` (`sender_id`);

ALTER TABLE `message_reactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `message_id` (`message_id`),
  ADD KEY `user_id` (`user_id`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);


ALTER TABLE `conversation_members`
  ADD CONSTRAINT `conversation_members_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `conversation_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `message_reactions`
  ADD CONSTRAINT `message_reactions_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `message_reactions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;
```
