# CS Win Bot 🏆

Discord bot do trackowania zwycięstw graczy Roblox Counter Strike i zarządzania clan leaderboardami.

## Opis

CS Win Bot pozwala graczom CS:GO na Roblox linkować swoje konta Discord z Roblox ID, trackować dzienne i tygodniowe wygrane, oraz rywalizować z członkami klanu na leaderboardach. Bot automatycznie aktualizuje statystyki i postuje leaderboardy zgodnie z harmonogramem.

## Funkcje

### Dla Graczy
- 🔗 Linkowanie konta Discord z Roblox ID
- 📊 Trackowanie dziennych i tygodniowych zwycięstw
- 🏆 Wyświetlanie osobistych statystyk i postępu
- 🎯 Śledzenie postępu względem celów klanowych
- 📈 Leaderboardy klanowe (NORMAL i ALL-TIME)

### Dla Liderów Klanów
- 🎯 Ustawianie tygodniowych celów zwycięstw dla członków
- 🏷️ Ustawianie tagów klanowych
- 📺 Konfiguracja kanału do automatycznych leaderboardów
- 👥 Zarządzanie informacjami o klanie

### Automatyzacja
- ⏰ Automatyczne publikowanie leaderboardów codziennie o 23:00 EST
- 🔄 Resetowanie dziennych statystyk codziennie o 23:05 EST
- 📅 Resetowanie tygodniowych statystyk w niedziele o 23:05 EST

## Wymagania

- **Node.js**: v16.x lub wyższy
- **npm**: v7.x lub wyższy
- **Discord Bot Token**: [Utwórz bota w Discord Developer Portal](https://discord.com/developers/applications)
- **Roblox API**: Bot korzysta z Roblox API do pobierania danych graczy

## Instalacja

1. Sklonuj repozytorium:
```bash
git clone https://github.com/yourusername/cswinbot.git
cd cswinbot
```

2. Zainstaluj zależności:
```bash
npm install
```

3. Utwórz plik `.env` w głównym katalogu:
```bash
touch .env
```

4. Dodaj Discord Token do pliku `.env`:
```env
DISCORD_TOKEN=your-discord-bot-token-here
```

5. Utwórz katalog data i wymagane pliki JSON:
```bash
mkdir -p src/data
echo '{"players":{}}' > src/data/playerData.json
echo '{"clans":{}}' > src/data/clans.json
```

## Uruchomienie

Uruchom bota:
```bash
node src/index.js
```

Lub dodaj do `package.json` script:
```json
{
  "scripts": {
    "start": "node src/index.js"
  }
}
```

Następnie uruchom:
```bash
npm start
```

## Komendy

### Komendy dla Wszystkich Użytkowników

#### `/linkcs <robloxid>`
Linkuje twoje konto Discord z Roblox ID.
- **Parametry**:
  - `robloxid` - Twoje Roblox ID (wymagane)
- **Przykład**: `/linkcs 123456789`
- **Opis**: Ustawia początkowe bazowe wartości dziennych i tygodniowych zwycięstw. Aktualizuje informacje o klanie jeśli gracz należy do klanu.

#### `/unlinkcs`
Odłącza twoje konto Roblox od Discord.
- **Parametry**: Brak
- **Opis**: Usuwa powiązanie między twoim Discord a Roblox ID. Możesz potem zlinkować inne konto.

#### `/mywins`
Wyświetla twoje statystyki: dzienne wygrane, tygodniowe wygrane i postęp względem celu.
- **Parametry**: Brak
- **Pokazuje**:
  - 🏆 Całkowite zwycięstwa
  - 📅 Dzienne wygrane (od ostatniego resetu)
  - 📆 Tygodniowe wygrane (od ostatniego resetu)
  - 🎯 Postęp względem tygodniowego celu (jeśli ustawiony)
  - Pasek postępu z kolorowym oznaczeniem

#### `/leaderboard <clantag>`
Wyświetla leaderboard klanu z opcją NORMAL lub ALL-TIME.
- **Parametry**:
  - `clantag` - Tag klanu (np. HoC, ES, tm) (wymagane)
- **Przykład**: `/leaderboard HoC`
- **Typy**:
  - **NORMAL** - Pokazuje dzienne i tygodniowe wygrane
  - **ALL-TIME** - Pokazuje całkowite wygrane od początku

### Komendy dla Liderów Klanów

#### `/setclantag <tag>`
Ustawia tag klanu (tylko właściciel klanu).
- **Parametry**:
  - `tag` - Tag klanu, max 6 znaków (wymagane)
- **Przykład**: `/setclantag [HoC]`
- **Wymagania**: Musisz być właścicielem klanu w Roblox

#### `/setwingoal <goal>`
Ustawia tygodniowy cel zwycięstw dla członków klanu (tylko właściciel klanu).
- **Parametry**:
  - `goal` - Liczba zwycięstw (1-10000) (wymagane)
- **Przykład**: `/setwingoal 500`
- **Wymagania**: Musisz być właścicielem klanu w Roblox
- **Efekt**: Cel pojawi się w `/mywins` i na leaderboardach

#### `/setchannel <channel>`
Ustawia kanał do automatycznych postów leaderboardów (tylko właściciel klanu).
- **Parametry**:
  - `channel` - Kanał tekstowy Discord (wymagane)
- **Przykład**: `/setchannel #leaderboards`
- **Wymagania**:
  - Musisz być właścicielem klanu w Roblox
  - Bot musi mieć uprawnienia "Send Messages" i "Embed Links" w kanale
- **Efekt**: Leaderboardy będą automatycznie publikowane codziennie o 23:00 EST

### Komendy Specjalne

#### `/bigdawg`
Komenda żartobliwa.

## Harmonogram Automatycznych Działań

Bot wykonuje następujące działania automatycznie:

| Akcja | Harmonogram | Opis |
|-------|-------------|------|
| **Post Leaderboard** | Codziennie 23:00 EST | Publikuje leaderboardy we wszystkich skonfigurowanych kanałach |
| **Daily Reset** | Codziennie 23:05 EST | Resetuje dzienne bazowe wartości zwycięstw dla wszystkich graczy |
| **Weekly Reset** | Niedziela 23:05 EST | Resetuje tygodniowe bazowe wartości zwycięstw dla wszystkich graczy |

## Struktura Plików

```
cswinbot/
├── src/
│   ├── commands/           # Komendy slash Discord
│   │   ├── linkCS.js       # Linkowanie Roblox ID
│   │   ├── unlinkCS.js     # Odłączanie konta
│   │   ├── myWins.js       # Statystyki gracza
│   │   ├── leaderboard.js  # Leaderboardy klanowe
│   │   ├── setClanTag.js   # Ustawianie tagu klanu
│   │   ├── setWinGoal.js   # Ustawianie celów
│   │   ├── setLeaderboardChannel.js # Konfiguracja kanału
│   │   └── bigDawg.js      # Komenda specjalna
│   ├── crons/              # Zaplanowane zadania
│   │   ├── leaderboardUpdateCron.js # Reset statystyk
│   │   └── leaderboardPostCron.js   # Publikowanie leaderboardów
│   ├── functions/
│   │   └── handleCommands.js # Dynamiczne ładowanie komend
│   ├── util/               # Funkcje pomocnicze
│   │   ├── apiHandler.js   # Integracja z Roblox API
│   │   ├── updateClanInfo.js # Aktualizacja informacji klanów
│   │   └── leaderboardUtils.js # Narzędzia leaderboardów
│   ├── data/               # Pliki danych (NIE w repozytorium)
│   │   ├── playerData.json # Dane graczy i baseline zwycięstw
│   │   └── clans.json      # Informacje o klanach
│   └── index.js            # Główny plik bota
├── .env                    # Zmienne środowiskowe (NIE w repozytorium)
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## Pliki Danych

### `playerData.json`
Przechowuje informacje o zlinkowanych graczach:
```json
{
  "players": {
    "discord_id_123": {
      "robloxId": "roblox_id_456",
      "clanId": 789,
      "dailyBaseline": 1250,
      "weeklyBaseline": 8900
    }
  }
}
```

### `clans.json`
Przechowuje informacje o klanach:
```json
{
  "clans": {
    "789": {
      "clanName": "House of Cards",
      "clanTag": "[HoC]",
      "weeklyWinGoal": 500,
      "leaderboardChannelId": "discord_channel_id",
      "winsOffset": 0
    }
  }
}
```

## Zależności

- **discord.js** (^14.25.1) - Discord API wrapper
- **@discordjs/rest** (^2.6.0) - REST API dla Discord
- **axios** (^1.13.2) - HTTP client dla Roblox API
- **dotenv** (^17.2.3) - Zarządzanie zmiennymi środowiskowymi
- **node-cron** (^4.2.1) - Planowanie zadań
- **chalk** (^5.6.2) - Kolorowanie logów konsoli
- **dayjs** (^1.11.19) - Manipulacja datami
- **fs-extra** (^11.3.2) - Rozszerzone operacje na plikach

## API

Bot korzysta z Roblox API do:
- Pobierania informacji o graczach (ID, wygrane)
- Pobierania nazw użytkowników Roblox
- Pobierania informacji o klanach
- Weryfikacji właścicieli klanów

## Bezpieczeństwo

- ⚠️ **NIGDY** nie commituj pliku `.env` do repozytorium
- ⚠️ **NIGDY** nie udostępniaj swojego Discord Bot Token
- ⚠️ Pliki `playerData.json` i `clans.json` są w `.gitignore` (zawierają wrażliwe dane)
- ✅ Bot używa ephemeral replies dla wrażliwych komend
- ✅ Weryfikacja uprawnień właściciela klanu poprzez Roblox API

## Rozwój

### Dodawanie Nowych Komend

1. Utwórz nowy plik w `src/commands/`
2. Użyj tego szablonu:

```javascript
module.exports = {
    name: "commandname",
    description: "Command description",
    options: [
        // Discord slash command options
    ],
    run: async (client, interaction) => {
        // Command logic
    }
};
```

3. Bot automatycznie załaduje komendę przy starcie

### Deployment Komend

Uruchom skrypt deployment aby zarejestrować komendy:
```bash
node src/util/deployCommands.js
```

## Troubleshooting

### Bot się nie uruchamia
- Sprawdź czy plik `.env` istnieje i zawiera poprawny token
- Sprawdź czy Node.js jest zainstalowany: `node --version`
- Sprawdź logi w konsoli pod kątem błędów

### Komendy nie działają
- Upewnij się, że komendy zostały zdeployowane: `node src/util/deployCommands.js`
- Sprawdź uprawnienia bota na serwerze Discord

### Leaderboardy się nie publikują
- Sprawdź czy kanał jest ustawiony: `/setchannel`
- Sprawdź uprawnienia bota w kanale (Send Messages, Embed Links)
- Sprawdź logi crona w konsoli

### API errors
- Bot używa rate limiting (100ms między requestami)
- Sprawdź czy Roblox API jest dostępne
- Sprawdź poprawność Roblox ID

## Kontakt & Wsparcie

W razie problemów:
1. Sprawdź sekcję Troubleshooting
2. Sprawdź logi konsoli pod kątem błędów
3. Upewnij się że wszystkie zależności są zainstalowane

## Licencja

ISC

## Autorzy

Projekt stworzony dla społeczności Roblox CS.

---

**Made with ❤️ for the CS Roblox community**
