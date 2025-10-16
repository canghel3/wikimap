package config

type MediaWikiConfig struct {
	URL   string `mapstructure:"url"`
	Rate  int    `mapstructure:"rate"`
	Burst int    `mapstructure:"burst"`
}
