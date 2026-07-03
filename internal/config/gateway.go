package config

type GatewayConfig struct {
	Port     int            `mapstructure:"port"`
	Services ServicesConfig `mapstructure:"services"`
}
