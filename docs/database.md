# 블로그 체험단 SaaS — 데이터베이스 설계

> 유저플로우에 명시적으로 포함된 데이터만 반영한 최소 스펙 설계

---

## 1. 데이터플로우

### 인플루언서 경로

```
[회원가입]
  auth.users 생성 (Supabase Auth)
  ├─ profiles INSERT (이름, 휴대폰번호, 이메일, 역할=influencer)
  └─ terms_agreements INSERT (약관동의 이력)
      │
      ▼
[인플루언서 정보 등록]
  influencer_profiles INSERT (생년월일, 상태=draft|submitted)
  influencer_channels INSERT/UPDATE/DELETE (채널유형, 채널명, URL, 검증상태)
      │
      ▼
[홈 & 체험단 목록 탐색]
  campaigns SELECT WHERE status = 'recruiting' (필터/정렬/페이징)
      │
      ▼
[체험단 상세]
  campaigns SELECT by id (기간, 혜택, 미션, 매장, 모집인원)
  influencer_profiles SELECT (등록 완료 여부 가드)
      │
      ▼
[체험단 지원]
  applications INSERT (각오 한마디, 방문 예정일자, 상태=applied)
  ※ 중복 지원 방지: (campaign_id, influencer_id) UNIQUE
      │
      ▼
[내 지원 목록]
  applications SELECT WHERE influencer_id = :me (상태 필터: applied/selected/rejected)
  campaigns JOIN (체험단 정보 함께 조회)
```

### 광고주 경로

```
[회원가입]
  auth.users 생성 (Supabase Auth)
  ├─ profiles INSERT (이름, 휴대폰번호, 이메일, 역할=advertiser)
  └─ terms_agreements INSERT (약관동의 이력)
      │
      ▼
[광고주 정보 등록]
  advertiser_profiles INSERT (업체명, 위치, 카테고리, 사업자등록번호, 상태=draft|pending|verified)
      │
      ▼
[체험단 관리]
  campaigns INSERT (등록 정보, 상태=recruiting)
  campaigns SELECT WHERE advertiser_id = :me (내 체험단 목록)
      │
      ▼
[체험단 상세 & 모집 관리]
  applications SELECT WHERE campaign_id = :id (지원자 리스트 조회)
  campaigns UPDATE status (recruiting → closed → selected)
  applications UPDATE status (applied → selected | rejected) ← 선정/반려 처리
```

### 테이블 간 관계도

```
auth.users (Supabase 관리)
    │
    └─ 1:1 ─ profiles
                │
                ├─ 1:N ─ terms_agreements
                │
                ├─ 1:1 ─ influencer_profiles ─── 1:N ─ influencer_channels
                │              │
                │              └──────── 1:N ─ applications
                │                                  │
                └─ 1:1 ─ advertiser_profiles       │
                               │                   │
                               └──── 1:N ─ campaigns
                                              │
                                              └─ 1:N ─ applications
```

---

## 2. 데이터베이스 스키마

### 2.1 ENUM 타입

```sql
-- 사용자 역할
CREATE TYPE user_role AS ENUM ('advertiser', 'influencer');

-- 인플루언서 프로필 상태
CREATE TYPE profile_status AS ENUM ('draft', 'submitted');

-- 채널 검증 상태
CREATE TYPE channel_verification_status AS ENUM ('pending', 'verified', 'failed');

-- 광고주 프로필 상태
CREATE TYPE advertiser_status AS ENUM ('draft', 'pending', 'verified', 'failed');

-- 체험단 상태
CREATE TYPE campaign_status AS ENUM ('recruiting', 'closed', 'selected');

-- 지원 상태
CREATE TYPE application_status AS ENUM ('applied', 'selected', 'rejected');
```

### 2.2 profiles — 사용자 기본 프로필

> 유저플로우 1: 이름, 휴대폰번호, 이메일, 역할

```sql
CREATE TABLE profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  phone       text        NOT NULL,
  email       text        NOT NULL UNIQUE,
  role        user_role   NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

### 2.3 terms_agreements — 약관 동의 이력

> 유저플로우 1: 약관동의, 약관 이력 저장

```sql
CREATE TABLE terms_agreements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  terms_type  text        NOT NULL,
  agreed_at   timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_terms_agreements_user_id ON terms_agreements(user_id);
```

### 2.4 influencer_profiles — 인플루언서 상세 프로필

> 유저플로우 2: 생년월일, 제출/임시저장 상태

```sql
CREATE TABLE influencer_profiles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid           NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  birth_date  date           NOT NULL,
  status      profile_status NOT NULL DEFAULT 'draft',
  created_at  timestamptz    NOT NULL DEFAULT now(),
  updated_at  timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX idx_influencer_profiles_user_id ON influencer_profiles(user_id);
```

### 2.5 influencer_channels — 인플루언서 SNS 채널

> 유저플로우 2: SNS 채널 유형/채널명/URL, 검증 상태(검증대기/성공/실패)

```sql
CREATE TABLE influencer_channels (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id       uuid                        NOT NULL REFERENCES influencer_profiles(id) ON DELETE CASCADE,
  channel_type        text                        NOT NULL,
  channel_name        text                        NOT NULL,
  channel_url         text                        NOT NULL,
  verification_status channel_verification_status NOT NULL DEFAULT 'pending',
  created_at          timestamptz                 NOT NULL DEFAULT now(),
  updated_at          timestamptz                 NOT NULL DEFAULT now()
);

CREATE INDEX idx_influencer_channels_influencer_id ON influencer_channels(influencer_id);
```

### 2.6 advertiser_profiles — 광고주 상세 프로필

> 유저플로우 3: 업체명, 위치, 카테고리, 사업자등록번호, 상태

```sql
CREATE TABLE advertiser_profiles (
  id                           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                      uuid              NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  business_name                text              NOT NULL,
  location                     text              NOT NULL,
  category                     text              NOT NULL,
  business_registration_number text              NOT NULL UNIQUE,
  status                       advertiser_status NOT NULL DEFAULT 'draft',
  created_at                   timestamptz       NOT NULL DEFAULT now(),
  updated_at                   timestamptz       NOT NULL DEFAULT now()
);

CREATE INDEX idx_advertiser_profiles_user_id ON advertiser_profiles(user_id);
```

### 2.7 campaigns — 체험단

> 유저플로우 5: 기간, 혜택, 미션, 매장, 모집인원
> 유저플로우 8: 상태=모집중
> 유저플로우 9: 모집중→모집종료→선정완료

```sql
CREATE TABLE campaigns (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id      uuid            NOT NULL REFERENCES advertiser_profiles(id) ON DELETE CASCADE,
  title              text            NOT NULL,
  description        text,
  reward             text            NOT NULL,
  mission            text            NOT NULL,
  store_name         text            NOT NULL,
  store_location     text            NOT NULL,
  max_applicants     integer         NOT NULL CHECK (max_applicants > 0),
  recruit_start_date date            NOT NULL,
  recruit_end_date   date            NOT NULL CHECK (recruit_end_date >= recruit_start_date),
  status             campaign_status NOT NULL DEFAULT 'recruiting',
  created_at         timestamptz     NOT NULL DEFAULT now(),
  updated_at         timestamptz     NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaigns_advertiser_id ON campaigns(advertiser_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
```

### 2.8 applications — 체험단 지원

> 유저플로우 6: 각오 한마디, 방문 예정일자
> 유저플로우 7: 상태 필터(신청완료/선정/반려)
> 유저플로우 9: 선정/반려 처리

```sql
CREATE TABLE applications (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id    uuid               NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  influencer_id  uuid               NOT NULL REFERENCES influencer_profiles(id) ON DELETE CASCADE,
  message        text               NOT NULL,
  visit_date     date               NOT NULL,
  status         application_status NOT NULL DEFAULT 'applied',
  created_at     timestamptz        NOT NULL DEFAULT now(),
  updated_at     timestamptz        NOT NULL DEFAULT now(),

  UNIQUE (campaign_id, influencer_id)
);

CREATE INDEX idx_applications_campaign_id ON applications(campaign_id);
CREATE INDEX idx_applications_influencer_id ON applications(influencer_id);
CREATE INDEX idx_applications_status ON applications(status);
```

### 2.9 공통 updated_at 트리거

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

적용 대상 테이블:

```sql
-- profiles
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- terms_agreements
CREATE TRIGGER trg_terms_agreements_updated_at
  BEFORE UPDATE ON terms_agreements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- influencer_profiles
CREATE TRIGGER trg_influencer_profiles_updated_at
  BEFORE UPDATE ON influencer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- influencer_channels
CREATE TRIGGER trg_influencer_channels_updated_at
  BEFORE UPDATE ON influencer_channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- advertiser_profiles
CREATE TRIGGER trg_advertiser_profiles_updated_at
  BEFORE UPDATE ON advertiser_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- campaigns
CREATE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- applications
CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 3. 유저플로우 → 테이블 매핑 요약

| 유저플로우 | 관련 테이블 | 주요 연산 |
|---|---|---|
| 1. 회원가입 & 역할선택 | `profiles`, `terms_agreements` | INSERT |
| 2. 인플루언서 정보 등록 | `influencer_profiles`, `influencer_channels` | INSERT, UPDATE, DELETE |
| 3. 광고주 정보 등록 | `advertiser_profiles` | INSERT, UPDATE |
| 4. 홈 & 체험단 목록 탐색 | `campaigns` | SELECT (필터/정렬/페이징) |
| 5. 체험단 상세 | `campaigns`, `influencer_profiles` | SELECT |
| 6. 체험단 지원 | `applications` | INSERT |
| 7. 내 지원 목록 | `applications` JOIN `campaigns` | SELECT (상태 필터) |
| 8. 광고주 체험단 관리 | `campaigns` | INSERT, SELECT |
| 9. 체험단 상세 & 모집 관리 | `campaigns`, `applications` | UPDATE (상태 전환) |
