package main

import (
	"github.com/canghel3/geo-wiki/cmd"
	"github.com/spf13/cobra"
)

func init() {
	cobra.OnInitialize(initConfig)
}

func main() {
	err := cmd.Execute()
	if err != nil {
		panic(err)
	}
}
