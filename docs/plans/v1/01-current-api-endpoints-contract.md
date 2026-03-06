# AmoSave.Web - V1 Current API Endpoints Contract Plan

## 1) Scope
This document captures the **currently available** endpoints from the live AmoSave API Swagger (`v1.0.0`) for planning and frontend alignment.

- Source: `http://localhost:5208/swagger/v1/swagger.json`
- Snapshot Date: 2026-02-23
- Purpose: Planning only (no implementation changes in this phase)

## 2) Global API Behavior
- Base route prefix: `/api/v1`
- Auth scheme: `Bearer` token in `Authorization` header
- Common response envelope shape:
  - `success: boolean`
  - `data: T | object | null`
  - `error: { code?: string; message?: string; details?: string[] }`
  - `timestamp: string (date-time)`

## 3) Available Endpoint Inventory (Current)
Total live endpoints: **8**

### A) Auth

#### 1) GET `/api/v1/Auth/login-url`
- Summary: Get Kite Connect login URL
- Request
  - Path params: none
  - Query params: none
  - Request body: none
- Possible responses
  - `200` -> `LoginUrlResponseApiResponse`
    - `data.loginUrl?: string`

#### 2) POST `/api/v1/Auth/session`
- Summary: Create session by exchanging request token
- Request
  - Path params: none
  - Query params: none
  - Request body: `CreateSessionRequest`
    - Required:
      - `requestToken: string`
- Possible responses
  - `200` -> `SessionResponseApiResponse`
    - `data.accessToken?: string`
    - `data.refreshToken?: string`
    - `data.userId?: string`
    - `data.userName?: string`
    - `data.email?: string`
    - `data.expiresAt?: string (date-time)`
  - `400` -> `ObjectApiResponse`
    - `error?: ApiError`

#### 3) POST `/api/v1/Auth/refresh`
- Summary: Refresh access token using refresh token
- Request
  - Path params: none
  - Query params: none
  - Request body: `RefreshTokenRequest`
    - Required:
      - `refreshToken: string`
- Possible responses
  - `200` -> `SessionResponseApiResponse`
    - `data.accessToken?: string`
    - `data.refreshToken?: string`
    - `data.userId?: string`
    - `data.userName?: string`
    - `data.email?: string`
    - `data.expiresAt?: string (date-time)`
  - `401` -> `ObjectApiResponse`
    - `error?: ApiError`

#### 4) POST `/api/v1/Auth/logout`
- Summary: Logout and invalidate session
- Request
  - Path params: none
  - Query params: none
  - Request body: none
- Possible responses
  - `200` -> `ObjectApiResponse`
  - `401` -> `ObjectApiResponse`

### B) 


#### 5) GET `/api/v1/Health`
- Summary: Get API health status
- Request
  - Path params: none
  - Query params: none
  - Request body: none
- Possible responses
  - `200` -> `HealthResponseApiResponse`
    - `data.status?: string`
    - `data.service?: string`
    - `data.version?: string`
    - `data.timestamp?: string (date-time)`
    - `data.environment?: string`
    - `data.uptime?: string`
    - `data.dependencies?: Record<string, string>`

### C) User

#### 6) GET `/api/v1/User/profile`
- Summary: Get user profile
- Request
  - Path params: none
  - Query params: none
  - Request body: none
- Possible responses
  - `200` -> `UserProfileResponseApiResponse`
    - `data.userId?: string`
    - `data.userName?: string`
    - `data.email?: string`
    - `data.userType?: string`
    - `data.broker?: string`
    - `data.exchanges?: string[]`
    - `data.products?: string[]`
    - `data.orderTypes?: string[]`
  - `401` -> `ObjectApiResponse`
    - `error?: ApiError`

#### 7) GET `/api/v1/User/margins`
- Summary: Get all margins
- Request
  - Path params: none
  - Query params: none
  - Request body: none
- Possible responses
  - `200` -> `StringMarginsResponseDictionaryApiResponse`
    - `data?: Record<string, MarginsResponse>`
      - Typical `MarginsResponse` fields:
        - `segment?: string`
        - `enabled?: boolean`
        - `net?: number`
        - `available?: AvailableMargins`
        - `utilised?: UtilisedMargins`
  - `401` -> `ObjectApiResponse`
    - `error?: ApiError`

#### 8) GET `/api/v1/User/margins/{segment}`
- Summary: Get margins for a specific segment
- Request
  - Path params:
    - `segment: string` (required) — example values: `equity`, `commodity`
  - Query params: none
  - Request body: none
- Possible responses
  - `200` -> `MarginsResponseApiResponse`
    - `data.segment?: string`
    - `data.enabled?: boolean`
    - `data.net?: number`
    - `data.available?: AvailableMargins`
    - `data.utilised?: UtilisedMargins`
  - `401` -> `ObjectApiResponse`
    - `error?: ApiError`

## 4) Planning Notes for Next Phase (No Code Yet)
- Prioritize first integration wave in this order:
  1. Auth (`login-url`, `session`, `refresh`, `logout`)
  2. User (`profile`, `margins`, `margins/{segment}`)
  3. Health (`/Health`) for diagnostics visibility
- Keep frontend envelope expectations aligned with backend fields (`timestamp` is present in backend responses).
- Use endpoint-level DTOs instead of generic dictionary types where possible.

## 5) Out of Scope in This V1 Contract Snapshot
The following domains are planned in the product UI but are **not currently available** in this live API snapshot:
- Orders
- Portfolio
- Market
- GTT
- Mutual Funds
- System parameters

These remain in roadmap/coverage docs and should be moved to implementation only after backend availability is confirmed in Swagger.
