# First deployment runbook

Статус: **черновик до выбора сервера, домена и TLS-способа**. Этот файл
фиксирует порядок первого deployment, но не является свидетельством успешного
релиза. Непроверенные на реальном сервере шаги нельзя отмечать выполненными в
`docs/roadmap/current-sprint.md`.

План работ и release criteria принадлежат
`docs/roadmap/backlog.md` → Sprint 1.1. Проверенные результаты активного спринта
записываются в `docs/roadmap/current-sprint.md`, а фактическая runtime-схема — в
`docs/architecture/current-architecture.md`.

## Принятая базовая схема

- Браузер обращается к одному HTTPS origin.
- Frontend использует относительный `VITE_API_URL=/api/v1`.
- Nginx обслуживает SPA и проксирует `/api/**` во внутренний Spring Boot
  upstream `:8080`.
- Spring Boot `:8080` и PostgreSQL не публикуются в интернет.
- `nginx/nginx.conf` пока содержит domain-independent HTTP-конфигурацию. Домен,
  TLS termination, firewall и platform-specific настройки добавляются при
  deployment.

В текущем draft `proxy_pass` направлен на `127.0.0.1:8080`: это работает, когда
Nginx и backend используют одну network namespace. В отдельном Nginx-контейнере
Compose потребуется адрес backend-сервиса во внутренней сети. `nginx -t` не
проверяет доступность этого адреса, поэтому после запуска нужен HTTP-запрос к
API через proxy.

Если будет выбран отдельный API origin, этот runbook нужно обновить до начала
релиза: потребуется явный Spring CORS contract и браузерная проверка preflight с
production frontend origin.

## Выбрать способ доставки

Выбор фиксируется в активном Sprint 1.1 до выполнения следующих разделов.

### Docker Compose — целевой вариант roadmap

Production frontend собирается в multi-stage Dockerfile, а `frontend/dist`
копируется в Nginx image на стадии build. Ручное копирование файлов в
`/var/www/llhelper` на host в этой схеме не требуется.

Dockerfile и Compose ещё не реализованы. После их появления этот раздел должен
содержать точные команды build, start, health check, migration и rollback.

Синтаксис текущего Nginx-конфига автоматически проверяет GitHub Actions
(`.github/workflows/nginx-config.yml`) в закреплённом официальном image. Локально
тот же check запускается из корня репозитория:

```bash
bash deploy/check-nginx-config.sh
```

При появлении production Nginx image нужно использовать в check его версию и
проверять финальный конфиг внутри собранного image. Успешный `nginx -t` проверяет
конфигурацию, но не подтверждает работу `/api` proxy, SPA fallback, cache headers
или HTTPS; для них нужны HTTP-проверки ниже.

### Bare VPS — допустимый ручной вариант

Только для deployment без frontend Docker image:

1. Собрать frontend и получить `frontend/dist`.
2. Доставить содержимое `frontend/dist` в release directory на сервере.
3. Атомарно направить `/var/www/llhelper` на новый release directory. Не удалять
   предыдущие hashed assets, пока ими могут пользоваться открытые клиенты.
4. Установить или подключить `deploy/nginx/nginx.conf` способом, принятым в
   выбранном Linux distribution. Не перезаписывать системный `nginx.conf`
   вслепую: текущий файл является полной конфигурацией с блоками `events` и
   `http`, а не только `server` snippet.
5. Добавить реальный `server_name`, HTTPS certificate, HTTP → HTTPS redirect и
   автоматическое обновление сертификата.

Точные пути, service manager и TLS-команды добавляются после выбора VPS image и
способа выпуска сертификата.

## Локальная подготовка frontend

Из корня репозитория:

```bash
cd frontend
npm ci
npm run lint
npm run format:check
npm run test:run
npm run build
```

Ожидаемый результат — production bundle в `frontend/dist`. Успешный
`npm run build` не проверяет production Nginx, TLS, headers или firewall.

## Настройка сервера и домена

После появления сервера и домена:

- [ ] DNS домена указывает на выбранный server/platform.
- [ ] Frontend release доставлен выбранным способом.
- [ ] Nginx-конфигурация адаптирована к реальному domain/upstream и установлена.
- [ ] Backend слушает только private/container interface либо firewall запрещает
      внешний доступ к `:8080`.
- [ ] PostgreSQL доступен только из private network.
- [ ] HTTPS включён; HTTP перенаправляется на HTTPS; certificate renewal
      настроен.
- [ ] Настроены body-size limits, forwarded-header trust и production health
      endpoint согласно Sprint 1.1 checklist.

Перед reload/restart на сервере обязательно выполнить:

```bash
sudo nginx -t
```

Перед reload/restart требуется успешный `nginx -t` именно с финальным конфигом
на выбранном сервере. Репозиторный check проверяет базовый draft: он выполнен
локально в Docker, а CI workflow добавлен; успешный CI run и проверка финального
deployment-конфига ещё не подтверждены.

## Проверка после deployment

Заменить placeholders реальными значениями. Проверки выполняются с внешней
машины, а не только с deployment host.

```bash
curl -sSI http://<domain>/
curl -fsSI https://<domain>/
curl -fsSI https://<domain>/<direct-spa-route>
curl -fsSI https://<domain>/assets/<existing-hashed-asset>
curl -i https://<domain>/assets/<missing-chunk>.js
curl -i https://<domain>/api/<health-path>
curl --connect-timeout 5 -i http://<server-ip>:8080/
```

Ожидаемые результаты:

- HTTP перенаправляется на HTTPS, certificate chain валидна.
- `/`, `index.html` и direct SPA route возвращают HTML с revalidation/no-cache.
- Существующий hashed asset возвращает
  `Cache-Control: public, max-age=31536000, immutable`.
- Отсутствующий chunk возвращает настоящий `404`, а не `index.html`.
- API доступен через `/api/**`; authenticated ответы не получают публичный
  proxy cache без отдельного решения.
- Запрос к публичному `<server-ip>:8080` завершается ошибкой подключения или
  timeout. Успешный HTTP-ответ означает release blocker.

Дополнительно через production UI повторяется обязательный Sprint 1.0 flow.
Проверяются refresh защищённых страниц, logout/login и сохранение learning
progress.

## Evidence и закрытие checklist

В активном `docs/roadmap/current-sprint.md` записать без credentials и tokens:

- дату, revision/image tag и environment;
- публичный origin;
- результат `nginx -t`;
- результаты HTTPS, proxy, cache-header и closed-port проверок;
- результат UI smoke;
- ссылку на CI run;
- backup/restore и rollback verification.

Этот runbook считается проверенным только после выполнения на выбранной
production-like платформе. До этого соответствующие пункты Sprint 1.1 остаются
открытыми.
