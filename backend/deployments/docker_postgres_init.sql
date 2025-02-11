CREATE USER geowiki;
CREATE ROLE geowiki;
CREATE DATABASE geowiki OWNER geowiki;
GRANT ALL PRIVILEGES ON DATABASE geowiki TO geowiki;

CREATE TABLE users(
    user_id serial primary key,
    username text unique not null,
    password text not null,
    email text not null,
    enabled boolean not null default false,
    created_at date
);
