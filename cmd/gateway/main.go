package main

import (
	"os"
	"strings"

	"github.com/canghel3/wikimap/internal/config"
	"github.com/canghel3/wikimap/internal/gateway"
)

func main() {
	cfg, err := config.LoadDir("")
	if err != nil {
		panic(err)
	}

	//env PORT is provided by GCP
	port := os.Getenv("PORT")
	if len(strings.TrimSpace(port)) == 0 {
		//
	}

	gatewayAPI := gateway.NewAPIGateway()
	if err := gatewayAPI.ListenAndServe(); err != nil {
		panic(err)
	}
}
