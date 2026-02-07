-- Migration: 블로그 체험단 SaaS 핵심 테이블 생성
-- Tables: profiles, terms_agreements, influencer_profiles, influencer_channels,
--         advertiser_profiles, campaigns, applications

BEGIN;

-- ============================================================
-- 1. ENUM 타입 생성
-- ============================================================

-- 사용자 역할
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('advertiser', 'influencer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 인플루언서 프로필 상태
DO $$ BEGIN
  CREATE TYPE profile_status AS ENUM ('draft', 'submitted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 채널 검증 상태
DO $$ BEGIN
  CREATE TYPE channel_verification_status AS ENUM ('pending', 'verified', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 광고주 프로필 상태
DO $$ BEGIN
  CREATE TYPE advertiser_status AS ENUM ('draft', 'pending', 'verified', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 체험단 상태
DO $$ BEGIN
  CREATE TYPE campaign_status AS ENUM ('recruiting', 'closed', 'selected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 지원 상태
DO $$ BEGIN
  CREATE TYPE application_status AS ENUM ('applied', 'selected', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. profiles — 사용자 기본 프로필
--    컬럼: id, name, phone, email, role, created_at, updated_at
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  phone       text        NOT NULL,
  email       text        NOT NULL UNIQUE,
  role        user_role   NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. terms_agreements — 약관 동의 이력
--    컬럼: id, user_id, terms_type, agreed_at, created_at, updated_at
-- ============================================================

CREATE TABLE IF NOT EXISTS terms_agreements (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  terms_type  text        NOT NULL,
  agreed_at   timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_terms_agreements_user_id ON terms_agreements(user_id);

ALTER TABLE IF EXISTS terms_agreements DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. influencer_profiles — 인플루언서 상세 프로필
--    컬럼: id, user_id, birth_date, status, created_at, updated_at
-- ============================================================

CREATE TABLE IF NOT EXISTS influencer_profiles (
  id          uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid           NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  birth_date  date           NOT NULL,
  status      profile_status NOT NULL DEFAULT 'draft',
  created_at  timestamptz    NOT NULL DEFAULT now(),
  updated_at  timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_influencer_profiles_user_id ON influencer_profiles(user_id);

ALTER TABLE IF EXISTS influencer_profiles DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. influencer_channels — 인플루언서 SNS 채널
--    컬럼: id, influencer_id, channel_type, channel_name, channel_url,
--          verification_status, created_at, updated_at
-- ============================================================

CREATE TABLE IF NOT EXISTS influencer_channels (
  id                  uuid                        PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id       uuid                        NOT NULL REFERENCES influencer_profiles(id) ON DELETE CASCADE,
  channel_type        text                        NOT NULL,
  channel_name        text                        NOT NULL,
  channel_url         text                        NOT NULL,
  verification_status channel_verification_status NOT NULL DEFAULT 'pending',
  created_at          timestamptz                 NOT NULL DEFAULT now(),
  updated_at          timestamptz                 NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_influencer_channels_influencer_id ON influencer_channels(influencer_id);

ALTER TABLE IF EXISTS influencer_channels DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. advertiser_profiles — 광고주 상세 프로필
--    컬럼: id, user_id, business_name, location, category,
--          business_registration_number, status, created_at, updated_at
-- ============================================================

CREATE TABLE IF NOT EXISTS advertiser_profiles (
  id                           uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                      uuid              NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  business_name                text              NOT NULL,
  location                     text              NOT NULL,
  category                     text              NOT NULL,
  business_registration_number text              NOT NULL UNIQUE,
  status                       advertiser_status NOT NULL DEFAULT 'draft',
  created_at                   timestamptz       NOT NULL DEFAULT now(),
  updated_at                   timestamptz       NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_advertiser_profiles_user_id ON advertiser_profiles(user_id);

ALTER TABLE IF EXISTS advertiser_profiles DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- 7. campaigns — 체험단
--    컬럼: id, advertiser_id, title, description, reward, mission,
--          store_name, store_location, max_applicants,
--          recruit_start_date, recruit_end_date, status,
--          created_at, updated_at
-- ============================================================

CREATE TABLE IF NOT EXISTS campaigns (
  id                 uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX IF NOT EXISTS idx_campaigns_advertiser_id ON campaigns(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

ALTER TABLE IF EXISTS campaigns DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- 8. applications — 체험단 지원
--    컬럼: id, campaign_id, influencer_id, message, visit_date,
--          status, created_at, updated_at
--    제약: (campaign_id, influencer_id) UNIQUE — 중복 지원 방지
-- ============================================================

CREATE TABLE IF NOT EXISTS applications (
  id             uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id    uuid               NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  influencer_id  uuid               NOT NULL REFERENCES influencer_profiles(id) ON DELETE CASCADE,
  message        text               NOT NULL,
  visit_date     date               NOT NULL,
  status         application_status NOT NULL DEFAULT 'applied',
  created_at     timestamptz        NOT NULL DEFAULT now(),
  updated_at     timestamptz        NOT NULL DEFAULT now(),

  UNIQUE (campaign_id, influencer_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_campaign_id ON applications(campaign_id);
CREATE INDEX IF NOT EXISTS idx_applications_influencer_id ON applications(influencer_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

ALTER TABLE IF EXISTS applications DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- 9. 공통 updated_at 트리거
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- profiles
DO $$ BEGIN
  CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- terms_agreements
DO $$ BEGIN
  CREATE TRIGGER trg_terms_agreements_updated_at
    BEFORE UPDATE ON terms_agreements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- influencer_profiles
DO $$ BEGIN
  CREATE TRIGGER trg_influencer_profiles_updated_at
    BEFORE UPDATE ON influencer_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- influencer_channels
DO $$ BEGIN
  CREATE TRIGGER trg_influencer_channels_updated_at
    BEFORE UPDATE ON influencer_channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- advertiser_profiles
DO $$ BEGIN
  CREATE TRIGGER trg_advertiser_profiles_updated_at
    BEFORE UPDATE ON advertiser_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- campaigns
DO $$ BEGIN
  CREATE TRIGGER trg_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- applications
DO $$ BEGIN
  CREATE TRIGGER trg_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMIT;
