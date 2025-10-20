package main

import (
	"strings"

	"github.com/canghel3/telemetry/log"
	"github.com/canghel3/wikimap/internal/config"
	"github.com/spf13/viper"
)

func initConfig() {
	viper.AddConfigPath("./")
	viper.AddConfigPath("../")
	viper.AddConfigPath("../..")
	viper.SetConfigName("config")

	viper.SetEnvPrefix("wikimap")
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err == nil {
		log.Stdout().Info().Logf("using config file: %s", viper.ConfigFileUsed())
	}

	err := viper.Unmarshal(&config.Root)
	if err != nil {
		panic(err)
	}
}
