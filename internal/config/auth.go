package config

type AuthConfig struct {
	Database DatabaseConnection `mapstructure:"database"`
}
