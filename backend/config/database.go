package config

type DatabaseConfig struct {
	Connection DatabaseConnection `mapstructure:"connection"`
}

type DatabaseConnection struct {
	Host     string `mapstructure:"host"`
	Port     string `mapstructure:"port"`
	DBName   string `mapstructure:"dbname"`
	User     string `mapstructure:"user"`
	Password string `mapstructure:"password"`
	SSLMode  string `mapstructure:"ssl"`
}
