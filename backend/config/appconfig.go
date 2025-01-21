package config

type AppConfiguration struct {
	Files     FilesConfig               `mapstructure:"files"`
	Databases map[string]DatabaseConfig `mapstructure:"databases"`
}

var AppConfig AppConfiguration
