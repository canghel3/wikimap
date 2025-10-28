package config

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/spf13/viper"
)

const defaultConfigDirectory = "config"

type Config struct {
	Auth      AuthConfig      `mapstructure:"auth"`
	MediaWiki MediaWikiConfig `mapstructure:"mediawiki"`
	Gateway   GatewayConfig   `mapstructure:"gateway"`
}

func LoadDir(dir string) (*Config, error) {
	if len(strings.TrimSpace(dir)) == 0 {
		wd, err := os.Getwd()
		if err != nil {
			return nil, fmt.Errorf("failed to get current working directory: %w", err)
		}
		dir = filepath.Join(wd, defaultConfigDirectory)
	}

	dirEntries, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}

	v := viper.New()
	for _, entry := range dirEntries {
		if entry.IsDir() {
			continue
		}

		fileName := entry.Name()
		fileExt := filepath.Ext(fileName)
		configKey := strings.TrimSuffix(fileName, fileExt)

		tv := viper.New()
		tv.AddConfigPath(dir)
		tv.SetConfigName(configKey)
		tv.SetConfigType(strings.TrimPrefix(fileExt, "."))

		if err := tv.ReadInConfig(); err != nil {
			return nil, fmt.Errorf("failed to read config file %s: %w", fileName, err)
		}

		v.Set(configKey, tv.AllSettings())
	}

	v.SetEnvPrefix("wikimap")
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	v.AutomaticEnv()

	var cfg Config
	err = v.Unmarshal(&cfg)
	if err != nil {
		return nil, err
	}

	return &cfg, nil
}
