FROM golang:1.25 AS compiler
WORKDIR /wikimap
COPY . /wikimap
RUN cd /wikimap && go mod tidy && CGO_ENABLED=0 GOOS=linux go build -o wikimap ./internal

FROM alpine:latest
WORKDIR /wikimap
COPY --from=compiler /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=compiler /wikimap /wikimap
COPY internal/config.json /wikimap/config.json

RUN apk add --no-cache bash

ENTRYPOINT ["./wikimap"]
