package config

type ServicesConfig struct {
	Services map[string]ServiceInfo `mapstructure:",remain"`
}

func (sc *ServicesConfig) Has(key string) bool {
	_, ok := sc.Services[key]
	return ok
}

func (sc *ServicesConfig) Get(key string) ServiceInfo {
	return sc.Services[key]
}

type ServiceInfo struct {
	Address string `mapstructure:"address"`
}
