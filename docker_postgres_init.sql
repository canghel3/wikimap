CREATE USER wikimap;
CREATE ROLE wikimap;
CREATE DATABASE wikimap OWNER wikimap;
GRANT ALL PRIVILEGES ON DATABASE wikimap TO wikimap;

CREATE TABLE users(
    user_id serial primary key,
    username text unique not null,
    password text not null,
    email text not null,
    enabled boolean not null default false,
    created_at date not null default current_timestamp
);
