# 闪搭 · 后端 API 契约文档

> 版本：v1.0
> 状态：前后端并行开发的基准契约，依据《MVP 需求文档 v1.2》起草
> 后端：NestJS + TypeORM + MySQL 8，位于本仓库 `server/` 目录
> 前端：Taro 小程序，请求层位于 `src/api/`

---

## 1. 全局约定

### 1.1 基础

- Base URL：`https://{domain}/api/v1`
- 传输格式：JSON（除图片上传为 multipart/form-data）
- 时间格式：ISO 8601 字符串（如 `2026-10-25T14:00:00+08:00`）；列表接口时间筛选用相对参数（见 §4.1）
- 字符编码：UTF-8

### 1.2 认证

- 除 `POST /auth/login`、`GET /geo/reverse` 外，所有接口需携带 JWT：

```
Authorization: Bearer <token>
```

- token 有效期 7 天，过期返回 `401 / A4010`，前端静默重新 `wx.login` 换发后重放原请求

### 1.3 统一响应体

成功：

```json
{ "code": 0, "message": "ok", "data": { } }
```

失败：

```json
{ "code": 4102, "message": "不符合伙伴偏好，无法申请", "data": null }
```

- `code = 0` 表示成功；非 0 为业务错误码（见 §9）
- HTTP 状态码与业务码并存：HTTP 表达传输/鉴权层，业务码表达领域规则

### 1.4 分页约定

- 请求参数：`page`（从 1 开始，默认 1）、`pageSize`（默认 10，上限 50）
- 响应 `data.list[]` + `data.total` + `data.page` + `data.pageSize`

---

## 2. 认证模块 Auth

### 2.1 登录

`POST /auth/login`

静默登录。前端 `wx.login` 拿 code 后换取 token。已注册用户返回资料完整度，前端据此决定是否跳转资料引导页。

请求：

```json
{ "code": "0c3Xxx0000xx111" }
```

响应 `data`：

```json
{
  "token": "eyJhbGciOi...",
  "user": {
    "id": 10001,
    "nickname": "阿黄",
    "avatar": "https://cdn.example.com/u/10001.jpg",
    "gender": "female",
    "birthYear": 1998,
    "age": 28,
    "wechatId": "ahuang_98",
    "interests": ["photography", "sports"],
    "profileCompleted": true
  }
}
```

说明：

- `code` 换 openid 后，老用户直接返回；新用户创建裸记录（仅 openid）
- `profileCompleted`：`gender && birthYear && nickname && avatar` 齐备为 true；`wechatId` 单独校验（发布时强制，见 §7.3 错误码）
- `age` 由 birthYear 派生，不落库

---

## 3. 用户模块 Users

### 3.1 获取我的资料

`GET /users/me`

响应 `data`：同 2.1 中 `user` 对象（含 `profileCompleted`）。

### 3.2 更新我的资料

`PATCH /users/me`

请求（均可选，仅传需更新字段）：

```json
{
  "nickname": "阿黄",
  "avatar": "https://cdn.example.com/u/10001.jpg",
  "gender": "female",
  "birthYear": 1998,
  "wechatId": "ahuang_98",
  "interests": ["photography", "sports"]
}
```

校验规则：

- `gender`：`female | male`
- `birthYear`：1900 ~ 当前年份-18（成年校验）；变更 birthYear 后派生 age 重算
- `interests`：⊆ `travel | photography | sports | food | show | game | study | outdoor`（不含 `other`，个人兴趣无"其他"），去重
- `wechatId`：2~30 字符；后端做内容安全校验

响应 `data`：更新后的 user 对象。

### 3.3 查看用户公开资料

`GET /users/:id/public`

用于详情页发起人卡片、审批页申请人卡片。响应 `data`：

```json
{
  "id": 10001,
  "nickname": "阿黄",
  "avatar": "https://cdn.example.com/u/10001.jpg",
  "gender": "female",
  "age": 28,
  "interests": ["photography", "sports"]
}
```

说明：公开资料**不含** `wechatId`、`birthYear`、`openid`（微信号仅成组后经申请详情披露，见 §5.4）。

---

## 4. 请求模块 Requests

### 4.1 请求流（首页）

`GET /requests`

请求参数（Query）：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `page` / `pageSize` | number | 否 | 分页，默认 1 / 10 |
| `type` | string | 否 | `travel / photography / sports / food / show / game / study / outdoor / other` |
| `timeRange` | string | 否 | `weekend / d7 / d30 / all`（本周末/近7天/近30天/不限），按 activityTime 过滤 |
| `lat` / `lng` | number | 条件 | 当前坐标；与 `sortBy=distance` 二选一组合 |
| `distance` | number | 否 | 距离范围过滤（km），如 5/10/50；不传则不限 |
| `city` | string | 条件 | 定位降级模式下的城市过滤；`lat/lng` 缺失时必传其一 |
| `sortBy` | string | 否 | `distance`（默认，需坐标）/ `time`（按 activityTime 倒序，降级模式默认） |
| `onlyApplicable` | boolean | 否 | 默认 false；true 时只返回我符合伙伴偏好的请求 |

响应 `data`：

```json
{
  "list": [
    {
      "id": 501,
      "type": "photography",
      "activityTime": "2026-10-25T07:00:00+08:00",
      "destination": "东澳岛",
      "city": "珠海",
      "genderPreference": "all",
      "ageRange": [18, 35],
      "descriptionSummary": "周末东澳岛拍星轨，两日一晚...",
      "coverImage": "https://cdn.example.com/r/501/0.jpg",
      "distanceKm": 12.4,
      "expired": false,
      "status": "recruiting",
      "approvedCount": 0,
      "maxMembers": 1,
      "myApplicationStatus": null,
      "publisher": { "id": 10001, "nickname": "阿黄", "avatar": "..." }
    }
  ],
  "total": 87, "page": 1, "pageSize": 10
}
```

规则：

- 只返回 `status = recruiting` 且 `reviewStatus = pass` 的请求（审核未完成/未通过的不进流，详见 §4.7）
- `distanceKm`：Haversine 计算，无坐标时为 null；`sortBy=distance` 时 null 距离的排最后
- `expired`：activityTime 已过时实时计算为 true，前端置灰不可申请
- `descriptionSummary`：描述截前 50 字
- `myApplicationStatus`：当前用户对该请求的申请状态（`pending/approved/rejected/null`），供卡片角标展示
- `onlyApplicable=true`：按当前用户 gender/age 与请求偏好双向匹配过滤

### 4.2 请求详情

`GET /requests/:id`

响应 `data`：

```json
{
  "id": 501,
  "type": "photography",
  "activityTime": "2026-10-25T07:00:00+08:00",
  "destination": "东澳岛",
  "location": { "lat": 22.017, "lng": 113.717, "city": "珠海" },
  "genderPreference": "all",
  "ageRange": [18, 35],
  "description": "完整描述文本...",
  "photos": ["https://cdn.example.com/r/501/0.jpg", "..."],
  "riskyPhotoUrls": [],
  "maxMembers": 1,
  "autoCloseOnGrouped": false,
  "approvedCount": 0,
  "status": "recruiting",
  "reviewStatus": "pass",
  "expired": false,
  "isPublisher": false,
  "applicable": true,
  "applicableReason": null,
  "myApplicationStatus": null,
  "publisher": { "id": 10001, "nickname": "阿黄", "avatar": "...", "gender": "female", "age": 28, "interests": ["photography"] }
}
```

规则：

- `applicable`：当前用户是否可申请（false 时 `applicableReason` 给出原因：偏好不符/已满员/已过期/重复申请/状态不可申请）；前端据此置灰按钮
- `isPublisher`：查看者即发布者时前端展示“管理”入口而非“申请”
- 非招募中状态（grouped/finished/cancelled）仍可查看，仅不可申请
- `reviewStatus != pass`（审核中/未通过）的详情仅发布者本人可访问，其他人访问返回 404；`photos` 原图全量返回，未通过审核的图片 URL 列在 `riskyPhotoUrls`，前端在对应图片左上角叠“未通过审核”角标（原图可见）

### 4.3 发布请求

`POST /requests`

请求：

```json
{
  "type": "photography",
  "activityTime": "2026-10-25T07:00:00+08:00",
  "destination": "东澳岛",
  "location": { "lat": 22.017, "lng": 113.717, "city": "珠海" },
  "genderPreference": "all",
  "ageRange": [18, 35],
  "description": "周末东澳岛拍星轨，两日一晚，找个会拍照的搭子...",
  "photos": ["https://cdn.example.com/r/tmp/a1.jpg", "..."],
  "maxMembers": 1,
  "autoCloseOnGrouped": false
}
```

校验规则（错误码见 §9）：

- 发布者必须已填 `wechatId`（4100）
- `activityTime` 必须晚于当前时间（4101）
- `photos` 1~6 张，须为本系统上传域名（4103）
- `description` 10~500 字，内容安全校验（4200）
- `maxMembers` 1~9，默认 1；`autoCloseOnGrouped` 默认 false
- `type`：`travel | photography | sports | food | show | game | study | outdoor | other`（v1.3 扩充）

发布副作用（先审后展门控，详见 §4.7）：

- `description` 同步送审 msgSecCheck v2（scene=3），`risky` 拒绝（4200）
- `photos` 异步送审 mediaCheckAsync；请求初始 `reviewStatus = checking`，首页不展示
- 开发 mock 模式（未配置 WX_APPID/SECRET）下图片直接判 pass，请求立即可见，保持本地联调体验

响应 `data`：完整 request 对象（同 4.2 结构，`isPublisher: true`）。

### 4.4 修改请求

`PATCH /requests/:id`

- 仅发布者本人可改（4104）
- 请求体同 4.3（仅传需更新字段）；修改不通知已申请者
- 可修改 `status`：`recruiting → finished`（手动结束招募）；已成组/已结束请求的偏好类字段不可再改

### 4.5 删除请求

`DELETE /requests/:id`

- 仅发布者本人可删（4104）
- 副作用：向该请求全部申请人（含 approved）推送 `requestClosed` 通知；微信号交换关系终止
- 响应 `data`: null

### 4.6 我发布的请求列表

`GET /users/me/requests?page=&pageSize=`

响应 `data.list[]`：请求对象 + 额外统计字段：

```json
{
  "id": 501,
  "status": "recruiting",
  "reviewStatus": "pass",
  "expired": false,
  "approvedCount": 1,
  "maxMembers": 1,
  "pendingCount": 3,
  "coverImage": "...",
  "activityTime": "...",
  "destination": "东澳岛",
  "type": "photography"
}
```

`pendingCount` 用于列表角标提示（待审批数）；`reviewStatus` 供"我发布的"列表渲染审核中/审核未通过/审核通过标记（状态机见 §4.7）。

### 4.7 内容安全审核状态机（先审后展）

`requests.reviewStatus`：`checking | pass | rejected`

- 发布：`description` 同步过 msgSecCheck v2（risky → 4200 拒绝）；图片异步送审 mediaCheckAsync，请求落库为 `checking`，首页请求流不展示，详情仅发布者可见
- 微信回调 `POST /wx/callback`（事件 `wxa_media_check`，trace_id 对账，幂等）：
  - 任一当前图片判 `risky` → `rejected`，推送 `contentBlocked` 通知（“未通过内容安全审核，已在首页隐藏，请更换图片后重新提交”）；详情 `riskyPhotoUrls` 标记违规图，前端原图叠角标
  - 全部图片判 `pass` → `pass`，请求进入首页请求流，发布者刷新首页即可看到
- 修改请求换图：新图重新送审、按当前 `photos` 数组重算（移除违规图可恢复 `pass`；新增图片回到 `checking`）
- 存量/种子数据无送审记录的图片视为 `pass`
- 开发 mock 模式（未配置 WX_APPID/SECRET 或 openid 以 `mock:` 开头）：不真实送审，图片直接判 `pass`，请求发布后立即可见
- 兜底：`checking` 超过 10 分钟仍未收到回调的图片自动置 `pass` 并重算（服务每 5 分钟扫描一次，启动 5 秒后先扫一次），覆盖回调丢失/未配置消息推送/本地无公网回调地址等场景，与 fail-open 策略一致
- 上线配置：小程序后台「开发 → 开发设置 → 消息推送」填 `https://{domain}/api/v1/wx/callback`，Token 与服务端 `WX_CALLBACK_TOKEN` 一致，数据格式 JSON

---

## 5. 申请模块 Applications

### 5.1 申请加入

`POST /requests/:id/applications`

请求：

```json
{ "message": "我也一直想去东澳岛拍星轨，带了三脚架，求带！" }
```

校验规则（按序校验，首个失败即返回错误码）：

1. 请求 status = recruiting 且未过期（4110）
2. 未满员：`approvedCount < maxMembers`（4111）
3. 伙伴偏好：申请者 gender 符合 `genderPreference`，age 在 `ageRange` 内（4102）
4. 未重复申请：该用户对该请求无 pending/approved 记录（4112，rejected 后可重新申请）
5. `message` 必填、1~100 字，内容安全校验（4200）

响应 `data`：

```json
{ "id": 9001, "status": "pending", "createdAt": "..." }
```

副作用：向发布者推送 `newApply` 通知。

### 5.2 某请求的申请列表（发布者）

`GET /requests/:id/applications?status=pending&page=&pageSize=`

- 仅发布者本人可查（4104）
- `status` 可选过滤：`pending / approved / rejected`
- 响应 `data.list[]`：

```json
{
  "id": 9001,
  "applicant": {
    "id": 10002,
    "nickname": "小蓝",
    "avatar": "...",
    "gender": "male",
    "age": 27,
    "interests": ["sports", "photography"],
    "wechatId": "xiaolan27"
  },
  "message": "我也一直想去东澳岛拍星轨...",
  "status": "pending",
  "createdAt": "..."
}
```

说明：申请人已填 `wechatId` 时，仅当其 `status = approved` 才在响应中返回 `wechatId` 字段，pending/rejected 时该字段为 null。

### 5.3 审批

`PATCH /applications/:id`

请求：

```json
{ "action": "approve" }
```

- `action`: `approve | reject`
- 仅该申请所属请求的发布者可操作（4104）；仅 `pending` 状态可操作（4113）
- approve 时校验未满员（4111）；满足 `autoCloseOnGrouped=true` 则请求自动置为 `grouped`
- 满员后对 pending 申请执行 approve 返回 4111，由发布者自行选择 reject

响应 `data`：更新后的 application（含申请人 wechatId，发布者审批通过后立即可见）。

副作用：向申请人推送 `applyApproved` / `applyRejected` 通知。

### 5.4 我的申请列表

`GET /users/me/applications?page=&pageSize=`

响应 `data.list[]`：

```json
{
  "id": 9001,
  "status": "approved",
  "message": "我也一直想去东澳岛拍星轨...",
  "createdAt": "...",
  "request": {
    "id": 501,
    "type": "photography",
    "activityTime": "...",
    "destination": "东澳岛",
    "coverImage": "...",
    "status": "recruiting",
    "expired": false
  },
  "publisherWechatId": "ahuang_98"
}
```

说明：`publisherWechatId` 仅当该申请 `status = approved` 且发布者请求未被删除时返回，否则为 null；发布者已删除请求时 request 由通知 + 状态置灰表达。

---

## 6. 通知模块 Notifications

### 6.1 通知列表

`GET /notifications?page=&pageSize=`

响应 `data.list[]`：

```json
{
  "id": 7001,
  "type": "newApply",
  "relatedId": 9001,
  "title": "小蓝 申请加入你的「东澳岛拍星轨」",
  "isRead": false,
  "createdAt": "..."
}
```

- `type`：`newApply | applyApproved | applyRejected | requestClosed`
- `relatedId`：指向 Application 或 Request id，前端按 type 跳转（newApply→申请审批，applyApproved/Rejected→我的申请详情，requestClosed→我的申请列表）
- 列表按 createdAt 倒序

### 6.2 未读数

`GET /notifications/unread-count`

响应 `data`: `{ "count": 3 }`，供 TabBar 红点。

### 6.3 标记已读

`PATCH /notifications/:id/read`（单条）/ `PATCH /notifications/read-all`

响应 `data`: null。

---

## 7. 文件与地理模块

### 7.1 上传图片

`POST /upload/image`（multipart/form-data）

- 字段：`file`，单文件；类型 jpg/png/webp；单张 ≤ 10MB
- MVP 允许批量：前端多图循环调用
- 响应 `data`: `{ "url": "https://{domain}/uploads/r/169xxxx.jpg" }`
- 存储：开发阶段本地 `server/uploads/` 静态目录；上线切 OSS/COS（StorageService 适配器，返回完整可访问 URL）
- 内容安全：发布请求时图片异步送审 mediaCheckAsync（上传接口本身不拦截），审核结果驱动请求 `reviewStatus`（见 §4.7）

### 7.2 逆地理编码（代理）

`GET /geo/reverse?lat=22.017&lng=113.717`

响应 `data`: `{ "city": "珠海", "district": "香洲区" }`

- 服务端代理腾讯位置服务（key 存服务端不暴露）
- 发布页取坐标后调用，替换现有写死"上海"的占位

---

## 8. 前端请求层目录规划（src/api/）

```
src/api/
  request.ts        # Taro.request 封装：baseUrl、token 注入、401 静默重登重放、统一错误码 toast
  auth.ts           # login
  user.ts           # getMe / updateMe / getPublicUser
  requestApi.ts     # listRequests / getRequest / createRequest / updateRequest / deleteRequest / myRequests
  application.ts     # apply / listByRequest / review / myApplications
  notification.ts   # list / unreadCount / markRead
  upload.ts         # uploadImage / reverseGeo
```

---

## 9. 错误码总表

| code | HTTP | 场景 | message 示例 |
| --- | --- | --- | --- |
| 0 | 200 | 成功 | ok |
| 4000 | 400 | 参数校验失败 | activityTime 格式错误 |
| 4010 | 401 | 未登录 / token 失效 | 请重新登录 |
| 4030 | 403 | 无权限操作他人资源 | 无权操作 |
| 4040 | 404 | 资源不存在 | 请求不存在或已删除 |
| 4100 | 400 | 发布者未填微信号 | 请先在"我的"中填写微信号 |
| 4101 | 400 | 活动时间已过 | 活动时间需晚于当前时间 |
| 4102 | 400 | 不符合伙伴偏好 | 不符合该请求的伙伴偏好 |
| 4103 | 400 | 图片来源非法 / 超限 | 照片须为本系统上传 |
| 4104 | 403 | 非发布者操作 | 仅发布者可操作 |
| 4110 | 400 | 请求不可申请（状态/过期） | 该请求已结束或已过期 |
| 4111 | 400 | 已满员 | 该请求已成组满员 |
| 4112 | 400 | 重复申请 | 已申请，请勿重复提交 |
| 4113 | 400 | 申请已被处理 | 该申请已审批 |
| 4200 | 400 | 内容安全校验未通过 | 内容含违规信息，请修改 |
| 5000 | 500 | 服务端错误 | 服务开小差了，请稍后再试 |

前端约定：`code !== 0` 时按 message toast；`4010` 触发静默重登后重放一次；其余 HTTP 4xx/5xx 统一走 4000/5000 兜底。

---

## 10. NestJS 模块规划（server/）

```
server/src/
  main.ts / app.module.ts
  common/            # 统一响应拦截器、异常过滤器（错误码）、分页 DTO、守卫（JWT）
  auth/              # POST /auth/login：code2Session + JWT 签发
  users/             # users entity + module
  requests/          # request entity + 列表查询（Haversine SQL）/详情/发布/修改/删除
  applications/      # application entity + 申请/审批（事务内满员校验）
  notifications/     # entity + 内部 service（事件驱动：申请/审批/删除时写入）
  upload/            # StorageService 接口 + LocalStorageProvider（本地）/ OssProvider（预留）
  geo/               # /geo/reverse 腾讯位置服务代理
  entities/          # User / Request / Application / Notification（TypeORM）
```

事务要求：审批 approve 必须在数据库事务内完成「校验满员 → 更新申请状态 → 递增 approvedCount → 判断 autoClose 更新请求状态 → 写通知」，防止并发下超额成组。

---

## 11. 开放问题（联调前需确认）

1. 内容安全接口：自建后端需申请微信开放平台的 msgSecCheck/imgSecCheck 调用权限（需小程序已发布？联调期可先 mock 通过）
2. 逆地理编码：需注册腾讯位置服务并申请 key（免费额度充足）
3. 图片 CDN 域名：上线后需加入小程序 downloadFile 合法域名白名单
