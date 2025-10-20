package main

import (
	"github.com/canghel3/wikimap/api"
	"github.com/canghel3/wikimap/config"
)

func init() {
	initConfig()
}

func main() {
	wikiMediaAPI := api.NewWikiMediaAPI(config.Root)
	if err := wikiMediaAPI.ListenAndServe(); err != nil {
		panic(err)
	}
}
