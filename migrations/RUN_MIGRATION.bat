@echo off
REM =====================================================
REM COMPLETE DATABASE RESET - CAMELCASE MIGRATION
REM =====================================================
REM This script will:
REM 1. Drop ALL existing tables
REM 2. Create new schema with camelCase naming
REM 3. Insert seed data
REM =====================================================

echo.
echo ========================================
echo GROUP SEVEN DATABASE RESET
echo ========================================
echo.
echo WARNING: This will DELETE ALL DATA!
echo.
set /p CONFIRM="Are you sure you want to continue? (yes/no): "

if /i not "%CONFIRM%"=="yes" (
    echo Migration cancelled.
    exit /b
)

echo.
echo Starting migration...
echo.

REM Database connection details
set DB_USER=postgres
set DB_NAME=group_seven_db
set PSQL_PATH="C:\Program Files\PostgreSQL\17\bin\psql.exe"

echo [1/3] Dropping all existing tables...
%PSQL_PATH% -U %DB_USER% -d %DB_NAME% -f "000_DROP_ALL_TABLES.sql"
if errorlevel 1 (
    echo ERROR: Failed to drop tables!
    pause
    exit /b 1
)

echo [2/3] Creating new schema with camelCase...
%PSQL_PATH% -U %DB_USER% -d %DB_NAME% -f "001_COMPLETE_SCHEMA_CAMELCASE.sql"
if errorlevel 1 (
    echo ERROR: Failed to create schema!
    pause
    exit /b 1
)

echo [3/3] Inserting seed data...
%PSQL_PATH% -U %DB_USER% -d %DB_NAME% -f "002_SEED_DATA.sql"
if errorlevel 1 (
    echo ERROR: Failed to insert seed data!
    pause
    exit /b 1
)

echo.
echo ========================================
echo MIGRATION COMPLETED SUCCESSFULLY!
echo ========================================
echo.
echo Database is now using camelCase naming throughout.
echo All backend services must use quoted identifiers.
echo.
pause
