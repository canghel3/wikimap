package config

type Configuration struct {
	MediaWiki MediaWikiConfig           `mapstructure:"mediawiki"`
	Server    ServerConfig              `mapstructure:"server"`
	Databases map[string]DatabaseConfig `mapstructure:"databases"`
}

var Root Configuration
