# Промт для AI-агента (Antigravity / Gemini 3.8 Flash): приложение «Задачи и цели»

## Что нужно сделать
Собери мобильное приложение на React Native (Expo, TypeScript) для iPhone — личный трекер задач и целей с локальным хранением в SQLite. Без бэкенда, без авторизации, один пользователь. Весь интерфейс — на русском языке.

## Стек и инструменты
- Expo (последняя стабильная SDK), TypeScript
- Навигация: expo-router (файловая маршрутизация, нативный stack и табы по умолчанию)
- Хранилище: expo-sqlite (без ORM, прямые SQL-запросы)
- Стилизация: StyleSheet.create, компонент Pressable для нажатий
- Модальное окно: нативный `Modal` с `presentationStyle="formSheet"`

## Структура проекта
```
app/
  _layout.tsx            — корневой layout, инициализация БД при старте
  (tabs)/
    _layout.tsx          — нижние табы: «Задачи», «Цели»
    index.tsx            — список задач
    goals.tsx            — список целей
  task/[id].tsx          — детали / редактирование задачи
  task/new.tsx           — добавление задачи
  goal/[id].tsx          — детали / редактирование цели
  goal/new.tsx           — добавление цели
lib/
  db.ts                  — инициализация SQLite и все CRUD-функции
components/
  ReflectionModal.tsx
  ProgressBar.tsx
  StatusBadge.tsx
```

## Схема SQLite (lib/db.ts)
```sql
CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  target_value REAL NOT NULL,
  current_value REAL NOT NULL DEFAULT 0,
  unit TEXT,
  deadline TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'not_started', -- not_started | in_progress | completed
  reflection TEXT,
  goal_id INTEGER REFERENCES goals(id),
  created_at TEXT NOT NULL,
  completed_at TEXT
);
```
Используй API expo-sqlite (`openDatabaseAsync`, `runAsync`, `getAllAsync`).

## Экраны и поведение

**Список задач** — `(tabs)/index.tsx`
- Фильтр сверху: Все / Не начато / В процессе / Выполнено
- Карточка: заголовок + цветной статус-бейдж (серый / синий / зелёный)
- Кнопка добавления → `task/new`, тап по карточке → `task/[id]`
- Свайп по карточке — удаление

**Детали задачи** — `task/[id].tsx`
- Заголовок и описание — редактируемые
- Кнопки смены статуса по порядку: «Начать» → «Завершить»
- При переходе в «Завершено» сразу показать ReflectionModal
- Если reflection уже заполнен — показать его текстом на экране

**ReflectionModal** — `components/ReflectionModal.tsx`
- Нативный `Modal`, `presentationStyle="formSheet"`
- Заголовок «Как это было?», многострочное поле ввода (необязательное)
- Кнопки «Сохранить» и «Пропустить» — обе закрывают модалку и проставляют `completed_at`; «Сохранить» дополнительно пишет текст в `reflection`

**Добавление задачи** — `task/new.tsx`
- Поля: заголовок (обязательно), описание, цель — Picker со списком целей + опция «Без цели» (`goal_id`)

**Список целей** — `(tabs)/goals.tsx`
- Карточка: заголовок, ProgressBar (`current_value` / `target_value`), подпись вида «32000 / 50000 ₽»
- Кнопка добавления → `goal/new`

**Детали цели** — `goal/[id].tsx`
- Поля: заголовок, `target_value`, unit, deadline — редактируемые
- Кнопка «+ добавить прогресс» — увеличивает `current_value` на введённую сумму

**Добавление цели** — `goal/new.tsx`
- Поля: заголовок (например «Заработать 50000»), `target_value`, unit и deadline — необязательно

## Тестирование и сборка на iPhone
1. Разработка: `npx expo start` → открыть в приложении Expo Go на iPhone (сканировать QR-код). Сертификаты не нужны.
2. Финальная установка со своими сертификатами: `eas build --platform ios` — сборка идёт в облаке Expo на их macOS-серверах, локальный Mac не требуется.
