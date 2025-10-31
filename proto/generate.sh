#!/bin/sh

#rm -rf mediawikipb && mkdir -p mediawikipb
#protoc --go_out=./mediawikipb --go_opt=paths=source_relative --go-grpc_out=./mediawikipb --go-grpc_opt=paths=source_relative ./mediawiki.proto

buf dep update
buf build
buf generate
