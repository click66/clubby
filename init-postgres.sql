create database southamptonjiujitsu;
create user sjcadmin with password 'Rand0m!';
alter role sjcadmin set client_encoding to 'utf8';
alter role sjcadmin set default_transaction_isolation to 'read committed';
alter role sjcadmin set timezone to 'UTC';
grant all privileges on database southamptonjiujitsu to sjcadmin;

create database sjcattendance;
create user sjcattendance with password 'Rand0m!';
alter role sjcattendance set client_encoding to 'utf8';
alter role sjcattendance set default_transaction_isolation to 'read committed';
alter role sjcattendance set timezone to 'UTC';
grant all privileges on database sjcattendance to sjcattendance;