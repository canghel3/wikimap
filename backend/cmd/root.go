package cmd

import (
	"github.com/canghel3/geo-wiki/api"
	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use: "server",
	RunE: func(cmd *cobra.Command, args []string) error {
		return api.Run()
	},
}

// Execute is the function called for the root command
func Execute() error {
	return rootCmd.Execute()
}
