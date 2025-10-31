package main

import (
	"net"
	"os"
	"path/filepath"
	"strings"

	"github.com/canghel3/telemetry/log"
	"github.com/canghel3/wikimap/internal/config"
	"github.com/canghel3/wikimap/internal/mediawiki"
	"github.com/canghel3/wikimap/proto/mediawikipb"
	"google.golang.org/grpc"
)

func main() {
	wd, err := os.Getwd()
	if err != nil {
		panic(err)
	}

	cfg, err := config.LoadDir(filepath.Join(wd, "config"))
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
