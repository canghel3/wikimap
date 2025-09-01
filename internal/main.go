package main

import (
	"github.com/canghel3/geo-wiki/api"
	"github.com/canghel3/geo-wiki/config"
)

func init() {
	initConfig()
}

func main() {
	server := api.NewServer(config.Root)
	if err := server.Run(); err != nil {
		panic(err)
	}
}
