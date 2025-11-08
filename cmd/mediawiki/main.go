package main

import (
	"net"
	"os"
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
		if strings.HasPrefix(port, ":") {
			cfg.MediaWiki.GrpcConfig.Port = port
		} else {
			cfg.MediaWiki.GrpcConfig.Port = ":" + port
		}
	}

	listener, err := net.Listen("tcp", cfg.MediaWiki.GrpcConfig.Port)
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
