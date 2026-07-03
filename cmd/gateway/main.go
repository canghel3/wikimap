package main

import (
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/canghel3/telemetry/log"
	"github.com/canghel3/wikimap/internal/config"
	"github.com/canghel3/wikimap/internal/gateway"
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
		portInt, err := strconv.ParseInt(strings.TrimPrefix(port, ":"), 10, 64)
		if err != nil {
			panic(err)
		}
		cfg.Gateway.Port = int(portInt)
	}

	log.Stdout().Info().Logf("config: %v", *cfg)

	gatewayAPI := gateway.NewAPIGateway(cfg.Gateway)
	if err = gatewayAPI.ListenAndServe(); err != nil {
		panic(err)
	}
}
