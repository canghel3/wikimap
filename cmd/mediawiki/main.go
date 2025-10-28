package main

import (
	"net"
	"os"
	"strings"

	"github.com/canghel3/wikimap/internal/config"
	"github.com/canghel3/wikimap/internal/mediawiki"
	"github.com/canghel3/wikimap/proto/mediawikipb"
	"google.golang.org/grpc"
)

func main() {
	cfg, err := config.LoadDir("")
	if err != nil {
		panic(err)
	}

	//env PORT is provided by GCP
	port := os.Getenv("PORT")
	if len(strings.TrimSpace(port)) == 0 {
		port = cfg.MediaWiki.GrpcConfig.Port
	}

	listener, err := net.Listen("tcp", port)
	if err != nil {
		panic(err)
	}

	server := grpc.NewServer()

	mediawikipb.RegisterMediaWikiServer(server, mediawiki.NewServer(cfg.MediaWiki))

	if err = server.Serve(listener); err != nil {
		panic(err)
	}
}
