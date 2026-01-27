-- ===================================
-- 龜三的ERP Demo - PostgreSQL 初始化腳本
-- ===================================

-- 設定時區
SET timezone = 'Asia/Taipei';

-- 建立擴充功能
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 輸出初始化完成訊息
DO $$
BEGIN
  RAISE NOTICE 'PostgreSQL 初始化完成 - 龜三的ERP Demo';
END $$;
