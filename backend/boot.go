package main

import (
	"github.com/Ginger955/telemetry/log"
	"github.com/canghel3/geo-wiki/config"
	"github.com/spf13/viper"
	"strings"
)

func initConfig() {
	viper.AddConfigPath("./")
	viper.AddConfigPath("./config")
	viper.SetConfigName("config")

	viper.SetEnvPrefix("munte")
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err == nil {
		log.Stdout().Info().Logf("using config file: %s", viper.ConfigFileUsed())
	}

	err := viper.Unmarshal(&config.AppConfig)
	if err != nil {
		panic(err)
	}
}
