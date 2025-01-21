CREATE DATABASE alpinism OWNER  alpinist;
GRANT ALL PRIVILEGES ON DATABASE alpinism TO alpinist;

CREATE TABLE users(
    user_id serial primary key,
    username text unique not null,
    password text not null,
    email text not null,
    enabled boolean not null default false,
    created_at date
);
CREATE TABLE routes (
    route_id serial primary key,
    name text not null,
    description text,
    grade text not null,
    latitude float not null,
    longitude float not null,
    created_at date,
    created_by integer references users(user_id),
    upvotes integer,
    downvotes integer,
    geom geometry(point, 4326)
);
