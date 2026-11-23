import type {INestApplication} from "@nestjs/common";
import {DocumentBuilder, SwaggerModule} from "@nestjs/swagger";
import type {OpenAPIObject} from "@nestjs/swagger";
import {z} from "zod";
import {createSchema as createWorkspaceSchema, renameSchema} from "./modules/workspaces/workspaces.controller.js";
import {startUploadInput} from "./modules/media/media.controller.js";
import {createTemplateInput, createVersionInput, createProjectInput, createRevisionInput} from "./modules/documents/documents-input.js";
import {createPublicationSchema, unpublishSchema, rsvpSchema} from "./modules/publications/publications-input.js";
import {templatePackageSchema} from "./modules/documents/template-package.js";
import {catalogPublishSchema} from "./modules/catalog/catalog.controller.js";
import {createCustomerInvitationSchema,updateCustomerInvitationSchema,customerPhotoSchema} from "./modules/customer-invitations/customer-invitations.controller.js";
import {publishCustomerSchema,unpublishCustomerSchema} from "./modules/customer-invitations/customer-publication.controller.js";

/**
 * eventiq API contract. Runtime validation remains in Zod; OpenAPI schemas mirror
 * public request semantics without exposing application internals or secrets.
 *
 * Production Swagger UI / JSON are opt-in (API_DOCS_ENABLED=true).
 */
const jsonObject = {type: "object", additionalProperties: true};
/** Swagger receives the same input contracts that Zod validates in controllers. */
function schema(validator: z.ZodType): Record<string, unknown> {
  const result = z.toJSONSchema(validator, {target: "openapi-3.0", io: "input", unrepresentable: "any"}) as Record<string, unknown>;
  delete result.$schema;
  return result;
}
const uuid = {type: "string", format: "uuid"};
const pathParams: Record<string, Record<string, unknown>> = {
  workspaceId: {type: "string", format: "uuid", description: "Идентификатор рабочего пространства (UUID)"},
  assetId: {type: "string", format: "uuid", description: "Идентификатор медиафайла (UUID)"},
  projectId: {type: "string", format: "uuid", description: "Идентификатор проекта (UUID)"},
  id: {type: "string", format: "uuid", description: "Идентификатор ресурса (UUID)"},
  number: {type: "integer", minimum: 1, description: "Положительный номер версии / ревизии"},
  templateId: {type: "string", format:"uuid"},
  slug: {type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", minLength: 3, maxLength: 80,
    description: "Публичный URL-slug"},
};
const pagination = [
  {name: "page", in: "query", required: false, description: "Page number, starting at 1 (default 1).", schema: {type: "integer", minimum: 1, maximum: 10000, default: 1}},
  {name: "limit", in: "query", required: false, description: "Items per page (default 20, maximum 50).", schema: {type: "integer", minimum: 1, maximum: 50, default: 20}},
];
const body = (schema: Record<string, unknown>, example?: Record<string, unknown>) => ({
  required: true,
  content: {"application/json": {schema, ...(example ? {example} : {})}},
});
const object = (properties: Record<string, unknown>, required: string[]) => ({
  type: "object", additionalProperties: false, properties, required,
});
const str = {type: "string"};
const positive = {type: "integer", minimum: 1};
type Endpoint = {
  method: "get" | "post" | "put" | "patch";
  path: string;
  tag: string;
  summary: string;
  description: string;
  public?: boolean;
  requestBody?: ReturnType<typeof body>;
  parameters?: Array<Record<string, unknown>>;
  responseExample?: Record<string, unknown>;
  responseSchema?: Record<string, unknown>;
  successStatus?: 200 | 201;
  errors?: number[];
};
const endpoints: Endpoint[] = [
  {method:"get",path:"/api/v1/health",tag:"System",summary:"Проверка доступности API",
    description:"Liveness. Показывает, что HTTP-процесс работает. Не проверяет PostgreSQL.",public:true,
    responseExample:{status:"ok",service:"invito-api"}},
  {method:"get",path:"/api/v1/health/ready",tag:"System",summary:"Проверка готовности PostgreSQL",
    description:"Readiness. Выполняет SELECT 1 через PrismaPg. При недоступности базы возвращает 503 без раскрытия деталей подключения.",public:true,
    responseExample:{status:"ready"},
    responseSchema:object({status:{type:"string",enum:["ready"]}},["status"]),errors:[503]},
  {method:"get",path:"/api/v1/me",tag:"Identity",summary:"Профиль текущего пользователя",
    description:"Проверяет JWT Supabase Auth (ES256/RS256) по issuer, audience и JWKS. При первом запросе регистрирует проверенную личность в PostgreSQL. Принимаются только user-сессии role=authenticated, anon/service_role отклоняются.",
    responseExample:{id:"00000000-0000-4000-8000-000000000001",displayName:"eventiq user",email:null},
    responseSchema:object({id:uuid,displayName:{type:"string"},email:{type:"string",nullable:true}},["id","displayName","email"]),errors:[401,403,503]},
  {method:"get",path:"/api/v1/me/workspaces",tag:"Workspaces",summary:"Мои рабочие пространства",
    description:"Только пространства, где пользователь состоит в WorkspaceMember. Роль вычисляется на сервере.",
    responseSchema:{type:"array",items:object({role:{type:"string",enum:["OWNER","ADMIN","EDITOR","VIEWER"]},joinedAt:{type:"string",format:"date-time"},workspace:jsonObject},["role","joinedAt","workspace"])},errors:[401]},
  {method:"post",path:"/api/v1/workspaces",tag:"Workspaces",summary:"Создать рабочее пространство",
    description:"Создаёт Workspace с текущим пользователем в роли OWNER. Slug уникален.",
    requestBody:body(schema(createWorkspaceSchema),{slug:"my-studio",name:"Моя студия"}),
    responseSchema:object({id:uuid,slug:{type:"string"},name:{type:"string"},createdAt:{type:"string",format:"date-time"}},["id","slug","name","createdAt"]),errors:[400,401,409]},
  {method:"get",path:"/api/v1/workspaces/{workspaceId}",tag:"Workspaces",summary:"Получить рабочее пространство",
    description:"Доступ только участникам. Несуществующие и недоступные пространства возвращают 404.",errors:[401,403,404]},
  {method:"patch",path:"/api/v1/workspaces/{workspaceId}",tag:"Workspaces",summary:"Переименовать рабочее пространство",
    description:"Требуется роль ADMIN или OWNER.",requestBody:body(schema(renameSchema),{name:"Новая студия"}),errors:[400,401,403,404]},
  {method:"get",path:"/api/v1/workspaces/{workspaceId}/templates",tag:"Templates",summary:"Список шаблонов Workspace",
    description:"Постраничный список шаблонов, доступных текущему участнику.",parameters:pagination,errors:[401,403,404]},
  {method:"post",path:"/api/v1/workspaces/{workspaceId}/templates",tag:"Templates",summary:"Создать шаблон",
    description:"Требуется роль редактора. Document и personalization проверяются на сервере по каноническим Studio v2-контрактам.",
    requestBody:body(schema(createTemplateInput)),
    responseSchema:object({id:uuid,workspaceId:uuid,slug:{type:"string"},name:{type:"string"},latestVersion:{type:"integer",minimum:1}},["id","workspaceId","slug","name","latestVersion"]),errors:[400,401,403,409,422]},
  {method:"post",path:"/api/v1/workspaces/{workspaceId}/template-packages/import",tag:"Templates",
    summary:"Импортировать JSON-пакет шаблона",
    description:"Только ADMIN/OWNER Workspace. Пакет eventiq-template v1: manifest, Studio v2 document и personalization. Изображения и музыка должны быть заранее загружены и подтверждены как READY в этом Workspace. Импорт создаёт DRAFT и неизменяемую первую версию, но не публикует шаблон.",
    requestBody:body(schema(templatePackageSchema)),
    responseSchema:object({id:uuid,workspaceId:uuid,slug:str,name:str,latestVersion:positive},["id","workspaceId","slug","name","latestVersion"]),
    errors:[400,401,403,404,409,422]},
  {method:"get",path:"/api/v1/catalog/templates",tag:"Catalog",summary:"Опубликованные шаблоны",
    description:"Публичный постраничный каталог. Только PUBLISHED. Без приватных документов и информации Workspace.",
    public:true,parameters:[
      {name:"category",in:"query",required:false,schema:{type:"string",enum:["WEDDING","KYZ_UZATUU","BIRTHDAY","ANNIVERSARY","CORPORATE","OTHER"]}},
      {name:"search",in:"query",required:false,schema:{type:"string",maxLength:100}},
      {name:"page",in:"query",required:false,schema:{type:"integer",minimum:1,maximum:10000}},
      {name:"limit",in:"query",required:false,schema:{type:"integer",minimum:1,maximum:48}},
    ],errors:[400,503]},
  {method:"get",path:"/api/v1/catalog/templates/{slug}",tag:"Catalog",summary:"Данные опубликованного шаблона",
    description:"Неизменяемая версия Studio v2 и разрешённые клиенту поля. Медиа представлены временными подписанными R2-ссылками, которые нельзя кешировать надолго.",
    public:true,errors:[400,404,503]},
  {method:"post",path:"/api/v1/workspaces/{workspaceId}/templates/{templateId}/publish",tag:"Catalog",
    summary:"Разместить шаблон в каталоге",
    description:"Только Workspace ADMIN/OWNER. Проверяет контракт персонализации, cover page и READY R2-медиа. Публикация шаблона не даёт клиенту админские права.",
    requestBody:body(schema(catalogPublishSchema)),errors:[400,401,403,404,409,422]},
  {method:"post",path:"/api/v1/customer/invitations",tag:"Customer Invitations",
    summary:"Создать личное приглашение из опубликованного шаблона",
    description:"Создаёт приватный черновик текущего пользователя, закреплённый за неизменяемой версией шаблона.",
    requestBody:body(schema(createCustomerInvitationSchema)),errors:[400,401,404,422]},
  {method:"get",path:"/api/v1/customer/invitations",tag:"Customer Invitations",
    summary:"Получить список своих черновиков",description:"Только черновики авторизованного пользователя.",errors:[401]},
  {method:"get",path:"/api/v1/customer/invitations/{id}",tag:"Customer Invitations",
    summary:"Загрузить черновик и его фотографии",description:"Проверяет ownerId, возвращает разрешённый patch, verified asset descriptors и временные R2 URL.",errors:[400,401,404,422]},
  {method:"patch",path:"/api/v1/customer/invitations/{id}",tag:"Customer Invitations",
    summary:"Сохранить личные изменения CAS",description:"Сервер сверяет права на все новые изображения и контракт текущей версии. expectedRevision защищает от перезаписи.",
    requestBody:body(schema(updateCustomerInvitationSchema)),errors:[400,401,404,409,422]},
  {method:"post",path:"/api/v1/customer/media/uploads",tag:"Customer Invitations",
    summary:"Получить signed PUT URL для собственной фотографии",
    requestBody:body(schema(customerPhotoSchema)),errors:[400,401,413,503]},
  {method:"post",path:"/api/v1/customer/media/{id}/complete",tag:"Customer Invitations",
    summary:"Проверить и завершить загрузку фотографии",errors:[400,401,404,409,422,503]},
  {method:"get",path:"/api/v1/customer/media/{id}/read-url",tag:"Customer Invitations",
    summary:"Получить временный URL своей фотографии",errors:[400,401,404,503]},
  {method:"get",path:"/api/v1/customer/invitations/{id}/publication",tag:"Customer Invitations",
    summary:"Моя публикация",description:"Текущий статус публикации собственного черновика; null, если ещё не опубликован.",errors:[400,401,404]},
  {method:"post",path:"/api/v1/customer/invitations/{id}/publish",tag:"Customer Invitations",
    summary:"Создать неизменяемый клиентский релиз",description:"Проверяет владельца, expectedRevision, expectedRelease, контракт и media ownership. Slug фиксирован после первого релиза.",
    requestBody:body(schema(publishCustomerSchema)),errors:[400,401,404,409,422,503]},
  {method:"post",path:"/api/v1/customer/invitations/{id}/unpublish",tag:"Customer Invitations",
    summary:"Снять личное приглашение с публикации",
    requestBody:body(schema(unpublishCustomerSchema)),errors:[400,401,404,409]},
  {method:"get",path:"/api/v1/public/customer-invitations/{slug}",tag:"Customer Invitations",
    summary:"Публичная страница гостевого приглашения",public:true,
    description:"Анонимный доступ только к ACTIVE неизменяемому релизу. RSVP доступен при настроенной защите Turnstile.",
    errors:[400,404,503]},
  {method:"post",path:"/api/v1/public/customer-invitations/{slug}/rsvp",tag:"Customer Invitations",
    public:true,summary:"Подтверждение участия гостем",
    description:"Только активный неизменяемый релиз; Turnstile требуется в production, проверяются дедлайн, лимиты и requestId.",
    requestBody:body(schema(rsvpSchema)),errors:[400,403,404,409,422,429,503]},
  {method:"get",path:"/api/v1/customer/invitations/{id}/rsvp/summary",tag:"Customer Invitations",
    summary:"Сводка RSVP для владельца",description:"Ответы доступны только владельцу личного приглашения.",errors:[400,401,404]},
  {method:"get",path:"/api/v1/customer/invitations/{id}/rsvp",tag:"Customer Invitations",
    summary:"Постраничный список гостей",description:"Только владелец; параметры page и limit, максимум 50 записей.",errors:[400,401,404]},
  {method:"get",path:"/api/v1/templates/{id}",tag:"Templates",summary:"Получить шаблон",
    description:"Возвращает доступный шаблон с метаданными и версией.",errors:[401,404]},
  {method:"get",path:"/api/v1/templates/{id}/versions/{number}",tag:"Templates",summary:"Получить версию шаблона",
    description:"Номер версии — положительное целое число. История версий неизменяема.",errors:[401,404]},
  {method:"post",path:"/api/v1/templates/{id}/versions",tag:"Templates",summary:"Добавить версию шаблона",
    description:"Оптимистичная блокировка по expectedVersion; при несовпадении — 409. Не перезаписывает старую версию.",
    requestBody:body(schema(createVersionInput)),errors:[400,401,403,409,422]},
  {method:"get",path:"/api/v1/workspaces/{workspaceId}/projects",tag:"Projects",summary:"Список проектов Workspace",
    description:"Постраничный список; проверка членства обязательна.",parameters:pagination,errors:[401,403,404]},
  {method:"post",path:"/api/v1/workspaces/{workspaceId}/projects",tag:"Projects",summary:"Создать проект",
    description:"Создаёт первую неизменяемую ревизию Studio v2. Cloud assets должны принадлежать текущему Workspace и быть READY.",
    requestBody:body(schema(createProjectInput)),
    responseSchema:object({id:uuid,title:{type:"string"},workspaceId:uuid,latestRevision:{type:"integer",minimum:1},createdAt:{type:"string",format:"date-time"}},["id","title","workspaceId","latestRevision","createdAt"]),errors:[400,401,403,422]},
  {method:"get",path:"/api/v1/projects/{id}",tag:"Projects",summary:"Получить проект",
    description:"Текущий снимок и latestRevision проекта. Проверяется доступ к Workspace.",errors:[401,404]},
  {method:"get",path:"/api/v1/projects/{id}/revisions/{number}",tag:"Projects",summary:"Получить неизменяемую ревизию",
    description:"Возвращает точную историческую версию документа, используемую для публикации.",errors:[401,404]},
  {method:"put",path:"/api/v1/projects/{id}/revisions",tag:"Projects",summary:"Сохранить новую ревизию (CAS)",
    description:"Compare-and-swap: expectedRevision обязан совпадать с актуальным номером. Конфликт 409 не уничтожает локальный черновик.",
    requestBody:body(schema(createRevisionInput)),
    responseSchema:object({id:uuid,number:{type:"integer",minimum:1},sha256:{type:"string"},createdAt:{type:"string",format:"date-time"}},["id","number","sha256","createdAt"]),errors:[400,401,403,409,422]},
  {method:"post",path:"/api/v1/workspaces/{workspaceId}/media/uploads",tag:"Media",summary:"Получить подписанный URL для загрузки R2",
    description:"Инициирует PENDING-upload и выдаёт 180-секундный presigned PUT URL. Браузер загружает сырой Blob напрямую в приватный R2 без Bearer токена.",
    requestBody:body(schema(startUploadInput),{name:"cover.webp",mimeType:"image/webp",bytes:204800,sha256:"0".repeat(64)}),errors:[400,401,403,409,413,503]},
  {method:"post",path:"/api/v1/workspaces/{workspaceId}/media/{assetId}/complete",tag:"Media",summary:"Проверить и завершить R2-загрузку",
    description:"Сервер сверяет SHA-256, MIME, декодируемость и размер; переносит объект из staging в immutable READY. Не передавайте сюда тело файла.",errors:[401,403,404,409,422,503]},
  {method:"get",path:"/api/v1/workspaces/{workspaceId}/media",tag:"Media",summary:"Список проверенных медиа",
    description:"Только READY-объекты; приватные R2-ключи не выдаются.",parameters:pagination,errors:[401,403,404]},
  {method:"get",path:"/api/v1/workspaces/{workspaceId}/media/{assetId}/read-url",tag:"Media",summary:"Получить временную ссылку на медиа",
    description:"Предоставляет подписанный GET URL: 60 секунд для изображений и 20 минут для MP3. Доступ ограничен членством в Workspace.",
    responseSchema:object({url:{type:"string",format:"uri",description:"Краткоживущая presigned GET-ссылка; не логируйте и не сохраняйте её."},expiresInSeconds:{type:"integer",enum:[60,1200]},mimeType:{type:"string"}},["url","expiresInSeconds","mimeType"]),errors:[401,403,404,503]},
  {method:"get",path:"/api/v1/projects/{projectId}/publication",tag:"Publications",summary:"Состояние публикации проекта",
    description:"Возвращает активную/снятую публикацию, адрес и номер релиза. Только авторизованным участникам.",errors:[401,403,404]},
  {method:"post",path:"/api/v1/projects/{projectId}/publish",tag:"Publications",summary:"Опубликовать неизменяемую ревизию",
    description:"OWNER/ADMIN. Публикация фиксирует projectRevisionId; optimistic concurrency через expectedRelease и безопасный повтор через idempotencyKey.",
    requestBody:body(schema(createPublicationSchema)),errors:[400,401,403,404,409,422]},
  {method:"post",path:"/api/v1/projects/{projectId}/unpublish",tag:"Publications",summary:"Снять приглашение с публикации",
    description:"Не удаляет историю релизов и ответов гостей. Требует точный expectedRelease.",
    requestBody:body(schema(unpublishSchema),{expectedRelease:1}),
    responseSchema:object({id:uuid,status:{type:"string",enum:["UNPUBLISHED"]},latestRelease:positive},["id","status","latestRelease"]),errors:[400,401,403,404,409]},
  {method:"get",path:"/api/v1/projects/{projectId}/rsvp",tag:"RSVP",summary:"Ответы гостей (приватно)",
    description:"Только участникам проекта с соответствующими правами. Не кешировать; ответы содержат персональные данные.",parameters:pagination,errors:[401,403,404]},
  {method:"get",path:"/api/v1/projects/{projectId}/rsvp/summary",tag:"RSVP",summary:"Агрегированная статистика RSVP",
    description:"Количество ответов и гостей по категориям. Только для участников Workspace.",
    responseSchema:object({responses:{type:"integer",minimum:0},attending:{type:"integer",minimum:0},declined:{type:"integer",minimum:0}},["responses","attending","declined"]),errors:[401,403,404]},
  {method:"get",path:"/api/v1/public/invitations/{slug}",tag:"Guest Invitations",summary:"Публичное приглашение",
    description:"Возвращает только активный опубликованный релиз. Не выдаёт приватные Workspace-данные. Не требует JWT.",public:true,errors:[404]},
  {method:"post",path:"/api/v1/public/invitations/{slug}/rsvp",tag:"Guest Invitations",summary:"Подтвердить участие (RSVP)",
    description:"Публичный endpoint: idempotency через requestId, серверная проверка лимитов, honeypot и Cloudflare Turnstile в production. Поле website должно быть пустым.",
    public:true,
    requestBody:body(schema(rsvpSchema),{requestId:"00000000-0000-4000-8000-000000000001",nodeId:"rsvp-1",name:"Гость",attendance:"yes",guests:1,website:""}),
    responseSchema:object({accepted:{type:"boolean"},receiptId:{...uuid,description:"Присутствует для принятого RSVP; отсутствует при honeypot-запросах."}},["accepted"]),
    errors:[400,403,404,409,429,503]},
];

function decorateDocument(document: OpenAPIObject): OpenAPIObject {
  const paths = document.paths as unknown as Record<string, Record<string, Record<string, unknown>>>;
  const documentedOperations = new Set<string>();
  for (const endpoint of endpoints) {
    const key = `${endpoint.method.toUpperCase()} ${endpoint.path}`;
    if (documentedOperations.has(key)) throw new Error(`Duplicate Swagger operation: ${key}`);
    documentedOperations.add(key);
    const operation = paths[endpoint.path]?.[endpoint.method];
    if (!operation) {
      throw new Error(`Swagger route mismatch: ${endpoint.method.toUpperCase()} ${endpoint.path}`);
    }
    operation.tags = [endpoint.tag];
    operation.summary = endpoint.summary;
    operation.description = endpoint.description;
    operation.operationId = endpoint.method + "_" + endpoint.path
      .replace(/^\/api\/v1\//, "").replace(/[{}]/g, "").replace(/[^a-zA-Z0-9]+/g, "_");
    if (!endpoint.public) operation.security = [{BearerAuth: []}];
    else operation.security = [];
    if (endpoint.requestBody) operation.requestBody = endpoint.requestBody;
    const routeParameters = [...endpoint.path.matchAll(/\{([^}]+)\}/g)].map((match) => {
      const name = match[1]!;
      const definition = pathParams[name];
      if (!definition) throw new Error(`Missing Swagger path parameter schema: ${name}`);
      const {description, ...paramSchema} = definition;
      return {name, in: "path", required: true, description, schema: paramSchema};
    });
    operation.parameters = [
      ...routeParameters,
      ...(endpoint.parameters ?? []),
    ];
    const responses = {...(operation.responses as Record<string, unknown> ?? {})};
    responses[endpoint.successStatus ?? (endpoint.method === "post" ? 201 : 200)] = {
      description: "Успешное выполнение операции",
      content: {"application/json": {schema: endpoint.responseSchema ?? jsonObject, ...(endpoint.responseExample ? {example: endpoint.responseExample} : {})}},
    };
    for (const status of endpoint.errors ?? []) {
      responses[String(status)] = {
        description: ({
          400:"Неверные параметры или тело запроса",401:"Bearer токен отсутствует или недействителен",
          403:"Недостаточно прав",404:"Ресурс не существует или недоступен",
          409:"Конфликт версии, адреса или идемпотентности",413:"Превышен лимит размера файла",
          422:"Документ или загруженный файл не прошёл проверку",429:"Слишком много запросов",
          503:"Сервис, PostgreSQL, OIDC или R2 временно недоступен",
        } as Record<number,string>)[status] ?? "Ошибка запроса",
        content:{"application/json":{schema:object({statusCode:{type:"integer"},message:str,error:str},["statusCode","message"])}},
      };
    }
    operation.responses = responses;
  }
  // Fail startup / CI if someone adds a controller route but forgets its API contract.
  const httpMethods = ["get", "post", "put", "patch", "delete", "head", "options"];
  for (const [path, item] of Object.entries(paths)) {
    for (const method of httpMethods) {
      if (item[method] && !documentedOperations.has(`${method.toUpperCase()} ${path}`)) {
        throw new Error(`Undocumented API route: ${method.toUpperCase()} ${path}`);
      }
    }
  }
  return document;
}

export function setupOpenApi(app: INestApplication): void {
  if (process.env.API_DOCS_ENABLED === "false" ||
      (process.env.NODE_ENV === "production" && process.env.API_DOCS_ENABLED !== "true")) return;
  const config = new DocumentBuilder()
    .setTitle("eventiq API")
    .setDescription([
      "REST API конструктора приглашений eventiq (NestJS 12, Prisma 7, PostgreSQL, Cloudflare R2).",
      "Версионирование: /api/v1. Контракт Supabase JWT: ES256/RS256, issuer + audience + JWKS; роли Workspace проверяются сервером.",
      "Все операции со Studio v2-документами валидируются серверными Zod-схемами. OpenAPI не заменяет runtime-валидацию.",
      "Авторизованные запросы: Bearer access token, не ID token. Публичные приглашения и RSVP не требуют авторизации.",
      "Локальные файлы загружаются через 180-секундный подписанный R2 PUT, затем проверяются сервером перед сохранением."
    ].join("\n\n"))
    .setVersion("1.0.0")
    .addBearerAuth({type:"http",scheme:"bearer",bearerFormat:"JWT",description:"Supabase Auth access_token с aud=authenticated; не используйте publishable key как Bearer"}, "BearerAuth")
    .addTag("System","Health и readiness")
    .addTag("Identity","OIDC-пользователь")
    .addTag("Workspaces","Мультиарендность, членство, роли")
    .addTag("Templates","Шаблоны и неизменяемые версии")
    .addTag("Catalog","Публичный каталог шаблонов")
    .addTag("Customer Invitations","Личные черновики и фотографии")
    .addTag("Projects","Документы и ревизии Studio v2")
    .addTag("Media","Приватное R2-хранилище")
    .addTag("Publications","Публикации и релизы")
    .addTag("RSVP","Приватная аналитика ответов")
    .addTag("Guest Invitations","Публичные гостевые endpoints")
    .build();
  const document = decorateDocument(SwaggerModule.createDocument(app,config));
  SwaggerModule.setup("api/v1/docs",app,document,{
    jsonDocumentUrl:"api/v1/openapi.json",
    swaggerOptions:{
      persistAuthorization:false,displayRequestDuration:true,filter:true,
      deepLinking:true,docExpansion:"none",defaultModelsExpandDepth:1,
      tryItOutEnabled:false,syntaxHighlight:{activate:true,theme:"obsidian"},
    },
    customSiteTitle:"eventiq API · Swagger",
  });
}
