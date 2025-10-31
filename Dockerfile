FROM golang:1.25 AS compiler
WORKDIR /app
# cache Go module dependencies first
COPY go.mod go.sum ./
RUN go mod download
COPY . .

FROM compiler AS gateway-builder
WORKDIR /gateway
RUN CGO_ENABLED=0 GOOS=linux go build -o gateway ./cmd/gateway

FROM compiler AS mediawiki-builder
WORKDIR /mediawiki
RUN CGO_ENABLED=0 GOOS=linux go build -o mediawiki ./cmd/mediawiki

FROM alpine:latest AS gateway
WORKDIR /gateway
COPY --from=gateway-builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=gateway-builder /gateway .
RUN apk add --no-cache bash
ENTRYPOINT ["./gateway"]

FROM alpine:latest AS mediawiki
WORKDIR /mediawiki
COPY --from=mediawiki-builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=mediawiki-builder /mediawiki .
RUN apk add --no-cache bash
ENTRYPOINT ["./mediawiki"]
