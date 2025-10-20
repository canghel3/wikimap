package main

import (
	"os"
	"strconv"
	"strings"

	"github.com/canghel3/wikimap/api"
	"github.com/canghel3/wikimap/config"
)

func init() {
	initConfig()

	//env PORT is provided by GCP
	portStr := os.Getenv("PORT")
	if len(strings.TrimSpace(portStr)) > 0 {
		portUint, err := strconv.ParseUint(portStr, 10, 16)
		if err != nil {
			panic(err)
		}

		config.Root.Server.Port = uint16(portUint)
	}
}

func main() {
	wikiMediaAPI := api.NewWikiMediaAPI(config.Root)
	if err := wikiMediaAPI.ListenAndServe(); err != nil {
		panic(err)
	}
}
