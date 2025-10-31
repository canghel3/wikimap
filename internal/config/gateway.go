package config

type GatewayConfig struct {
	Port     string         `mapstructure:"port"`
	Services ServicesConfig `mapstructure:"services"`
}
