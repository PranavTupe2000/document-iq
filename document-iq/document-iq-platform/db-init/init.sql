-- =========================
-- Account Service Database
-- =========================

CREATE DATABASE IF NOT EXISTS document_iq_account_db;

CREATE USER IF NOT EXISTS 'account_user'@'%' IDENTIFIED BY 'account_pass123';

GRANT ALL PRIVILEGES ON document_iq_account_db.* TO 'account_user'@'%';


-- =========================
-- Application Service Database
-- =========================

CREATE DATABASE IF NOT EXISTS document_iq_application_db;

CREATE USER IF NOT EXISTS 'application_user'@'%' IDENTIFIED BY 'application_pass123';

GRANT ALL PRIVILEGES ON document_iq_application_db.* TO 'application_user'@'%';


FLUSH PRIVILEGES;
