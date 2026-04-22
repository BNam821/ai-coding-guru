# AI Logging Guide

Tai lieu nay huong dan cach su dung he thong luu AI exchange log vua duoc trien khai trong du an `AI Coding Guru`.

## 1. Muc dich

He thong nay duoc dung de:

- Luu lai du lieu AI tra ve cho 4 luong hien tai:
  - `learn-ai-question`
  - `quiz-generation`
  - `dashboard-ai-evaluation`
  - `code-evaluation`
- Ho tro debug khi AI tra sai format, loi parse JSON, hoac output khong hop le.
- Ho tro quan tri vien tra cuu lich su goi AI.
- Cho phep nguoi dung xem lich su AI o che do `safe view`.

## 2. Pham vi hien tai

Phien ban hien tai luu:

- `prompt_text`
- `response_text`
- `response_payload`
- `request_payload`
- `metadata`
- `status`
- `error_message`
- `duration_ms`
- `created_at`
- `expires_at`

Phan hien thi duoc tach quyen:

- `Admin` xem duoc full exchange.
- `User` chi xem duoc output va metadata an toan, khong xem raw prompt noi bo.

## 3. Cac file lien quan

### SQL

- [docs/sql/add-ai-interactions.sql](./sql/add-ai-interactions.sql)

### Code xu ly

- `src/lib/ai-interactions.ts`
- `src/lib/ai-logging.ts`
- `src/lib/gemini.ts`

### API

- `GET /api/ai/logs`
- `POST /api/ai/logs/cleanup`

### UI

- `GET /history/ai`
- `GET /dashboard/ai-logs`

## 4. Setup lan dau

### Buoc 1: Tao bang va ham cleanup

Mo `Supabase SQL Editor`, chay file:

- [docs/sql/add-ai-interactions.sql](./sql/add-ai-interactions.sql)

File nay se:

- Tao bang `public.ai_interactions`
- Tao index
- Tao function `public.cleanup_expired_ai_interactions()`
- Co gang tao cron cleanup moi ngay neu `pg_cron` kha dung

### Buoc 2: Kiem tra bang da tao chua

Chay SQL:

```sql
select *
from public.ai_interactions
order by created_at desc
limit 5;
```

Neu chua co log nao, query van hop le va tra ve 0 dong.

### Buoc 3: Kiem tra cleanup function

```sql
select public.cleanup_expired_ai_interactions();
```

Ham se tra ve so luong ban ghi da bi xoa.

## 5. Luong du lieu hoat dong

Moi khi mot luong AI duoc goi:

1. Code tao `promptText`.
2. He thong goi wrapper `runLoggedAiTask(...)`.
3. Wrapper goi model Gemini.
4. Neu thanh cong:
   - luu `status = 'success'`
   - luu `response_text`
   - luu `response_payload`
5. Neu that bai:
   - luu `status = 'error'`
   - luu `error_message`
   - luu phan output nhan duoc neu co
6. Du lieu duoc ghi vao `public.ai_interactions`.

Luu y:

- Logging la `best effort`.
- Neu insert log vao Supabase that bai, tinh nang AI chinh van tiep tuc chay.

## 6. Cau truc bang `ai_interactions`

### Cac cot quan trong

- `id`: khoa chinh UUID
- `username`: ten nguoi dung, co the `null`
- `task_type`: loai tac vu AI
- `prompt_id`: ma prompt noi bo
- `endpoint`: route goi AI
- `model_provider`: hien tai la `google`
- `model_name`: hien tai la `gemini-2.5-flash-lite`
- `status`: `success` hoac `error`
- `request_payload`: payload da rut gon, phuc vu quan tri
- `metadata`: thong tin phu, nhu so lan retry
- `prompt_text`: raw prompt gui AI
- `response_text`: raw text AI tra ve
- `response_payload`: JSON da parse neu co
- `error_message`: noi dung loi
- `duration_ms`: thoi gian xu ly
- `created_at`: thoi diem tao log
- `expires_at`: thoi diem het han

### Kiem tra nhanh thong ke

```sql
select
    task_type,
    status,
    count(*) as total_logs
from public.ai_interactions
group by task_type, status
order by task_type, status;
```

## 7. Cach xem du lieu

### 7.1. User xem lich su AI

Trang:

- `/history/ai`

User co the:

- Loc theo `taskType`
- Loc theo `status`
- Loc theo `from` / `to`
- Phan trang

User KHONG thay:

- `prompt_text`
- `request_payload`

### 7.2. Admin xem full logs

Trang:

- `/dashboard/ai-logs`

Admin co the:

- Loc theo `username`
- Loc theo `taskType`
- Loc theo `status`
- Loc theo `from` / `to`
- Xem:
  - `prompt_text`
  - `request_payload`
  - `response_text`
  - `response_payload`
  - `metadata`
  - `error_message`

### 7.3. Cleanup bang tay tren giao dien

Admin co the bam nut:

- `Cleanup log het han`

Nut nay goi API:

- `POST /api/ai/logs/cleanup`

## 8. API huong dan su dung

## 8.1. Lay danh sach log

Endpoint:

```txt
GET /api/ai/logs
```

### Query params

- `taskType`
- `status`
- `from`
- `to`
- `page`
- `username` (chi admin dung duoc)

### Vi du cho user

```txt
/api/ai/logs?taskType=quiz-generation&status=success&page=1
```

### Vi du cho admin

```txt
/api/ai/logs?username=campha8&taskType=code-evaluation&from=2026-04-01&to=2026-04-30&page=1
```

### Response mau

```json
{
  "success": true,
  "isAdmin": false,
  "logs": [
    {
      "visibility": "user",
      "id": "9ed1d81b-xxxx",
      "username": "campha8",
      "taskType": "quiz-generation",
      "promptId": "quiz-generation",
      "endpoint": "/api/quiz/generate",
      "modelProvider": "google",
      "modelName": "gemini-2.5-flash-lite",
      "status": "success",
      "metadata": {
        "attempt": 1
      },
      "responseText": "...",
      "responsePayload": [],
      "errorMessage": null,
      "durationMs": 1420,
      "createdAt": "2026-04-23T03:15:00.000Z",
      "expiresAt": "2026-05-23T03:15:00.000Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalCount": 12,
  "totalPages": 1
}
```

### Ma loi

- `401 Unauthorized`: chua dang nhap
- `403 Forbidden`: route cleanup, nhung khong phai admin

## 8.2. Cleanup log het han

Endpoint:

```txt
POST /api/ai/logs/cleanup
```

Chi `admin` moi dung duoc.

### Response mau

```json
{
  "success": true,
  "deletedCount": 18,
  "cleanedAt": "2026-04-23T03:25:00.000Z"
}
```

## 9. Cach nhap du lieu

He thong hien tai KHONG co API import log rieng.

Neu can nhap du lieu, co 3 cach an toan:

### Cach 1: Import CSV truc tiep trong Supabase Table Editor

Dung khi:

- Muon import mot lo CSV log cu
- Khong can automation tu code app

Can map dung cac cot:

- `username`
- `task_type`
- `prompt_id`
- `endpoint`
- `model_provider`
- `model_name`
- `status`
- `request_payload`
- `metadata`
- `prompt_text`
- `response_text`
- `response_payload`
- `error_message`
- `duration_ms`
- `created_at`
- `expires_at`

Luu y:

- `request_payload`, `metadata`, `response_payload` phai la JSON hop le.
- `status` chi duoc la `success` hoac `error`.
- `task_type` chi duoc la 1 trong 4 gia tri da dinh nghia.

### Cach 2: Import bang SQL

Vi du:

```sql
insert into public.ai_interactions (
    username,
    task_type,
    prompt_id,
    endpoint,
    model_provider,
    model_name,
    status,
    request_payload,
    metadata,
    prompt_text,
    response_text,
    response_payload,
    error_message,
    duration_ms,
    created_at,
    expires_at
)
values (
    'campha8',
    'quiz-generation',
    'quiz-generation',
    '/api/quiz/generate',
    'google',
    'gemini-2.5-flash-lite',
    'success',
    '{"mode":"auto"}'::jsonb,
    '{"attempt":1}'::jsonb,
    'Prompt mau',
    'Response mau',
    '[]'::jsonb,
    null,
    1200,
    now(),
    now() + interval '30 days'
);
```

### Cach 3: Import tu script ngoai

Neu muon import so luong lon, nen:

- Doc file nguon
- Validate `task_type`, `status`, JSON
- Batch insert vao Supabase

Khuyen nghi:

- Insert theo lo nho, vi du 100-500 dong/lan
- Kiem tra bang `ai_interactions` sau moi dot import

## 10. Cach xuat du lieu

He thong hien tai ho tro xuat du lieu theo 3 cach chinh.

### Cach 1: Xuat bang query SQL

Vi du xuat toan bo log thanh cong cua quiz:

```sql
select *
from public.ai_interactions
where task_type = 'quiz-generation'
  and status = 'success'
order by created_at desc;
```

Vi du xuat log loi cua mot user:

```sql
select *
from public.ai_interactions
where username = 'campha8'
  and status = 'error'
order by created_at desc;
```

### Cach 2: Export CSV trong Supabase

Tu Supabase Dashboard:

1. Mo `Table Editor`
2. Chon bang `ai_interactions`
3. Ap dung filter neu can
4. Chon `Export`
5. Tai ve file CSV

Dung cho:

- Chia se log cho team
- Luu backup nhanh
- Phan tich bang Excel / Google Sheets

### Cach 3: Xuat qua API

Neu can export theo quyen dang nhap:

- User goi `GET /api/ai/logs`
- Admin goi `GET /api/ai/logs?...`

Sau do luu response JSON thanh file.

Dung cho:

- Dashboard noi bo
- Dong bo voi he thong khac
- Tich hop ETL nho

## 11. Truy van thuong dung

### 11.1. Log moi nhat

```sql
select id, username, task_type, status, created_at
from public.ai_interactions
order by created_at desc
limit 20;
```

### 11.2. Dem log theo user

```sql
select username, count(*) as total_logs
from public.ai_interactions
group by username
order by total_logs desc;
```

### 11.3. Tim cac log loi

```sql
select id, username, task_type, endpoint, error_message, created_at
from public.ai_interactions
where status = 'error'
order by created_at desc;
```

### 11.4. Tim log sap het han

```sql
select id, username, task_type, expires_at
from public.ai_interactions
where expires_at <= now() + interval '3 days'
order by expires_at asc;
```

## 12. Backup va phuc hoi

### Backup nhe

- Export CSV tu `Table Editor`
- Hoac luu JSON response tu `GET /api/ai/logs`

### Backup day du

Dung SQL dump hoac script rieng tu Postgres client.

### Phuc hoi

Sau khi co du lieu backup:

- Import CSV vao bang `ai_interactions`
- Hoac `insert` lai bang SQL

Sau khi phuc hoi, nen chay:

```sql
select count(*) from public.ai_interactions;
```

de doi chieu tong so dong.

## 13. Van de thuong gap

### Loi SQL khi tao cron

Neu gap loi syntax trong `cron.schedule(...)`, kiem tra file SQL co dung dollar-quote tag rieng hay khong:

```sql
$cron$select public.cleanup_expired_ai_interactions();$cron$
```

Khong dung lai `$$...$$` ben trong `do $$ ... $$`.

### Khong xem duoc log

Kiem tra:

- Da dang nhap chua
- User co dung role `admin` neu vao `/dashboard/ai-logs` khong
- Bang `ai_interactions` da duoc tao chua

### Khong co cron cleanup

Neu `pg_cron` khong kha dung:

- Dung nut `Cleanup log het han` tren trang admin
- Hoac chay tay:

```sql
select public.cleanup_expired_ai_interactions();
```

## 14. Gioi han va khuyen nghi

### Gioi han hien tai

- Chua co API import log chinh thuc
- Chua co RLS cho bang `ai_interactions`
- Quyen xem log dang duoc chan o tang server route

### Khuyen nghi van hanh

- Theo doi dung luong bang `ai_interactions` dinh ky
- Giup `expires_at` luon duoc cleanup deu
- Khong cho user xem `prompt_text`
- Neu luong log tang nhanh, can can nhac:
  - truncation prompt
  - sampling
  - tach bang archive

## 15. Checklist su dung nhanh

### Khi moi setup

- Chay [docs/sql/add-ai-interactions.sql](./sql/add-ai-interactions.sql)
- Kiem tra bang `ai_interactions`
- Kiem tra `cleanup_expired_ai_interactions()`

### Khi can debug AI

- Mo `/dashboard/ai-logs`
- Loc theo `taskType`, `username`, `status`
- Mo `prompt_text`, `response_text`, `response_payload`

### Khi can xuat du lieu

- SQL query
- Export CSV trong Supabase
- Hoac goi `GET /api/ai/logs`

### Khi can don dep

- Bam nut `Cleanup log het han`
- Hoac chay:

```sql
select public.cleanup_expired_ai_interactions();
```
