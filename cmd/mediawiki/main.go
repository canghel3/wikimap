package main

import (
	"net"
	"os"
	"strconv"
	"strings"

	"github.com/canghel3/telemetry/log"
	"github.com/canghel3/wikimap/internal/config"
	"github.com/canghel3/wikimap/internal/mediawiki"
	"github.com/canghel3/wikimap/proto/mediawikipb"
	"google.golang.org/grpc"
)

func main() {
	cfg, err := config.LoadDir(config.DefaultConfigDirectory)
	if err != nil {
		panic(err)
	}

	//env PORT is provided by GCP
	port := os.Getenv("PORT")
	if len(strings.TrimSpace(port)) > 0 {
		portInt, err := strconv.ParseInt(strings.TrimPrefix(port, ":"), 10, 64)
		if err != nil {
			panic(err)
		}
		cfg.MediaWiki.GrpcConfig.Port = int(portInt)
	}

	listener, err := net.Listen("tcp", strconv.Itoa(cfg.MediaWiki.GrpcConfig.Port))
	if err != nil {
		panic(err)
	}

	server := grpc.NewServer()
	mediawikipb.RegisterMediaWikiServer(server, mediawiki.NewServer(cfg.MediaWiki))

	log.Stdout().Info().Log("starting mediawiki grpc server")
	if err = server.Serve(listener); err != nil {
		panic(err)
	}
}
