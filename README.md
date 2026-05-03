# Chess Platform

Chess Platform — TypeScript monorepo для шахматного приложения с локальной игрой, игрой против Stockfish, онлайн-комнатами, обучающими позициями, профилем игрока, лидербордом и Pro-подпиской через Stripe.

Проект состоит из трех приложений и нескольких общих пакетов. Оркестрация выполняется через pnpm workspaces и Turborepo.

## Возможности

- Локальная шахматная доска с историей ходов, тайм-контролем и разбором партии.
- Игра против бота на Stockfish с несколькими уровнями сложности.
- Онлайн-комнаты по коду через Socket.IO.
- JWT-аутентификация: регистрация, вход, refresh token.
- Профиль пользователя, ELO, город и настройки кастомизации.
- Лидерборд с фильтрацией по городу.
- Обучающий раздел с позициями в стиле известных шахматистов.
- Сохранение партий и Stockfish-анализ через API.
- Stripe Checkout для Pro-подписки и webhook для обновления статуса пользователя.

## Структура

| Путь | Назначение |
| --- | --- |
| `apps/api` | NestJS API, MongoDB/Mongoose, JWT, WebSocket rooms, Stripe, серверный Stockfish-анализ |
| `apps/web` | Основное Next.js приложение: игра, профиль, обучение, лидерборд, кастомизация |
| `apps/landing` | Отдельный Next.js лендинг с переходами в web-приложение |
| `packages/chess-engine` | Общая шахматная логика: FEN, ходы, статусы партии |
| `packages/ui` | Общие React UI-компоненты и шахматная доска |
| `packages/types` | Общие TypeScript-типы |
| `packages/config` | Общие конфиги и dev-скрипты |

## Стек

- Node.js `>=20.19.0 <25`
- pnpm `9.15.4`
- TypeScript
- Turborepo
- Next.js 14, React 18, Tailwind CSS
- NestJS 10
- MongoDB, Mongoose
- Socket.IO
- Stockfish
- Stripe
- Vitest

## Быстрый старт

Установите зависимости:

```bash
pnpm install
```

Создайте локальный `.env`:

```bash
cp .env.example .env
```

Запустите MongoDB. Самый простой вариант через Docker Compose:

```bash
docker compose up mongo
```

В другом терминале запустите все приложения:

```bash
pnpm dev
```

После запуска доступны:

- Web app: http://localhost:3000
- Landing: http://localhost:5000
- API: http://localhost:8080
- API health check: http://localhost:8080/health

## Переменные окружения

Основной пример находится в `.env.example`.

| Переменная | Назначение |
| --- | --- |
| `API_PORT` | Порт NestJS API, по умолчанию `8080` |
| `WEB_PORT` | Порт основного Next.js приложения, по умолчанию `3000` |
| `LANDING_PORT` | Порт лендинга, по умолчанию `5000` |
| `MONGODB_URI` | Строка подключения к MongoDB |
| `JWT_SECRET` | Секрет access token |
| `JWT_REFRESH_SECRET` | Секрет refresh token |
| `STRIPE_SECRET_KEY` | Secret key Stripe |
| `STRIPE_WEBHOOK_SECRET` | Секрет Stripe webhook endpoint |
| `STRIPE_PRO_PRICE_ID` | Price ID для Pro-подписки |
| `API_URL` | Внутренний URL API для server-side запросов |
| `NEXT_PUBLIC_API_URL` | Публичный URL API для браузера |
| `NEXT_PUBLIC_WS_URL` | URL Socket.IO API |
| `NEXT_PUBLIC_WEB_URL` | URL web-приложения |
| `NEXT_PUBLIC_LANDING_URL` | URL лендинга |
| `WEB_ORIGIN` | Origin web-приложения для CORS |
| `LANDING_ORIGIN` | Origin лендинга для CORS |

Для локальной разработки можно оставить тестовые Stripe-значения из `.env.example`, если не проверяете платежный сценарий. Для реального Checkout нужны рабочие `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` и `STRIPE_PRO_PRICE_ID`.

## Команды

Команды выполняются из корня репозитория.

```bash
pnpm dev
pnpm build
pnpm lint
pnpm test
```

Запуск отдельного workspace:

```bash
pnpm --filter @chess-platform/api dev
pnpm --filter @chess-platform/web dev
pnpm --filter @chess-platform/landing dev
```

Сборка отдельного workspace:

```bash
pnpm --filter @chess-platform/api build
pnpm --filter @chess-platform/web build
pnpm --filter @chess-platform/landing build
```

## API

Базовый URL локально: `http://localhost:8080`.

Основные REST-маршруты:

| Метод | Маршрут | Назначение |
| --- | --- | --- |
| `GET` | `/health` | Проверка API |
| `POST` | `/auth/register` | Регистрация |
| `POST` | `/auth/login` | Вход |
| `POST` | `/auth/refresh` | Обновление токенов |
| `GET` | `/users/me` | Текущий пользователь |
| `PATCH` | `/users/me` | Обновление профиля |
| `PATCH` | `/users/me/preferences` | Обновление настроек |
| `GET` | `/leaderboard` | Глобальный лидерборд |
| `GET` | `/leaderboard?city=...` | Лидерборд по городу |
| `POST` | `/games` | Создание записи партии |
| `GET` | `/games/history` | История партий текущего пользователя |
| `GET` | `/games/:id` | Получение партии |
| `POST` | `/games/analyze` | Анализ PGN |
| `POST` | `/games/:id/analyze` | Запуск анализа сохраненной партии |
| `POST` | `/rooms` | Создание онлайн-комнаты |
| `GET` | `/rooms/:code` | Получение комнаты по коду |
| `POST` | `/payments/checkout` | Создание Stripe Checkout session |
| `GET` | `/payments/subscription` | Текущая подписка |
| `POST` | `/payments/cancel-subscription` | Отмена подписки |
| `POST` | `/payments/webhook` | Stripe webhook |

Защищенные маршруты ожидают `Authorization: Bearer <accessToken>`.

WebSocket namespace для онлайн-комнат:

```text
/rooms
```

Основные события:

- `join`
- `move`
- `resign`
- `room:state`
- `room:finished`

## Docker

В репозитории есть `docker-compose.yml` для API и MongoDB:

```bash
docker compose up --build api
```

По умолчанию API внутри Compose подключается к MongoDB по адресу:

```env
MONGODB_URI=mongodb://mongo:27017/chess-platform
```

## Railway

Для API production-команды такие:

```bash
pnpm --filter @chess-platform/api build
pnpm --filter @chess-platform/api start
```

Если Railway показывает `MongoServerError: Authentication failed.`, проверьте `MONGODB_URI`. Для Railway MongoDB public TCP proxy строка обычно выглядит так:

```env
MONGODB_URI="mongodb://mongo:<password>@<host>:<port>/chess-platform?authSource=admin"
```

## Разработка

- Общие типы и пакеты собираются перед приложениями через `prebuild` scripts.
- Dev-скрипты читают корневой `.env` через `packages/config/env.cjs`.
- Если порт занят, dev-скрипт завершится с понятной ошибкой вместо автоматического выбора другого порта.
- Stockfish для браузера лежит в `apps/web/public/stockfish`.
- Серверный анализ использует пакет `stockfish` в `apps/api`.

## Проверка

Запуск всех тестов:

```bash
pnpm test
```

Запуск тестов шахматного движка:

```bash
pnpm --filter @chess-platform/chess-engine test
```

Линтинг всего monorepo:

```bash
pnpm lint
```
