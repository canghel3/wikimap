package config

type MediaWikiConfig struct {
	WikiConfig WikiConfig `mapstructure:"wiki"`
	GrpcConfig GrpcConfig `mapstructure:"grpc"`
}

type WikiConfig struct {
	URL   string `mapstructure:"url"`
	Rate  int    `mapstructure:"rate"`
	Burst int    `mapstructure:"burst"`
}

type GrpcConfig struct {
	Port string `mapstructure:"port"`
}
