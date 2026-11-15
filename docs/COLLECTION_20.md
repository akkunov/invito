# INVITO — 10 веб-дизайнов и 10 кыргызских обложек

Статус: frontend-прототип, не production. Исходная ветка: `feat/editorial-invitations-20261115`.

## Состав

### 10 самостоятельных веб-шаблонов

| Slug | Название | Применение |
| --- | --- | --- |
| `collection-fashion-editorial` | Fashion Editorial | Свадьба, крупный фотопортрет |
| `collection-romantic-floral` | Romantic Floral | Свадьба, цветочный стиль |
| `collection-classic-ivory-gold` | Ivory & Gold | Свадьба, симметрия и золото |
| `collection-dark-luxury` | Dark Luxury | Премиальная тёмная свадьба |
| `collection-mono-typography` | Modern Monochrome | Свадьба, типографика |
| `collection-botanical-natural` | Botanical Nature | Эко-свадьба |
| `collection-photo-story` | Photo Story | День рождения, коллаж |
| `collection-destination-travel` | Destination Travel | Свадьба-путешествие |
| `collection-modern-heritage` | Modern Heritage | Кыз узатуу |
| `collection-playful-celebration` | Playful Celebration | День рождения |

Каждый шаблон — конфигурация `TemplateDefinition` + собственная композиция обложки в `collection.css` + общие блоки приглашения. Это не статический скриншот дизайн-референса.

### 10 национальных обложек

- `heritage-ak-shyrdak`
- `heritage-kyzyl-barkhat`
- `heritage-ak-oymo`
- `heritage-kok-muras`
- `heritage-ak-orgo`
- `heritage-gul-muras`
- `heritage-ala-too`
- `heritage-keremet`
- `heritage-altyn-medallion`
- `heritage-tulpar`

Каждая обложка доступна как самостоятельный шаблон с блоками события и как альтернатива **обложке любого существующего шаблона** через инспектор редактора. Графические узоры — фиксированное изображение, поверх которого независимо рендерятся редактируемые имена, дата и загружаемый портрет. В отличие от редактируемой фотографии, декор не заменяется.

## Проверка

```bash
npm ci
npm run test:collection
npm run test:editor-navigation
npm run test:editorial
npm run typecheck
npm run lint
npm run build
npm run dev
```

Проверить: `/ru/templates`, `/ky/templates`, `/ru/templates/collection-fashion-editorial`, `/ru/templates/collection-heritage-ak-shyrdak`.

Для редактора: `/ru/editor?template=collection-fashion-editorial` или ссылка «Настроить шаблон» из каталога. Выбрать слева «Обложка», затем один из 10 вариантов в правой панели; проверить, что изменение фото не затрагивает орнаменты, а галерея, музыка и roadmap остаются доступными.

## Ограничения

- Файлы обложек — адаптации исходной визуальной подборки, не файлы для типографской печати.
- 10 новых полноценных веб-дизайнов — вариант первого релиза, а не точная пиксельная копия концепт-артов; фотографии демонстрационные.
- Сохранение данных происходит локально в браузере, серверный publishing/RSVP пока не подключен.
- При добавлении обложки в существующий шаблон её исходный hero заменяется только на уровне рендеринга, остальные секции не меняются.
- Автовоспроизведение музыки без клика запрещено политиками браузеров; используется существующий плеер.
- Локальная статическая проверка/тесты прошли, однако сборка Next.js и реальные E2E-тесты без установленных npm-зависимостей не подтверждены.
