package api

import (
	"github.com/Ginger955/telemetry/log"
	"github.com/canghel3/geo-wiki/config"
	"github.com/canghel3/geo-wiki/service"
	"github.com/gin-gonic/gin"
)

type Point struct {
	Lat         float64 `json:"lat"`
	Lon         float64 `json:"lon"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
}

func Run() error {
	log.Stdout().Info().Log("starting server")

	r := gin.Default()

	configuration := config.AppConfig

	// serve static files (CSS, JS, etc.)
	r.Static("/assets", configuration.Files.Static.Root)

	// serve the main HTML page
	r.GET("/", func(c *gin.Context) {
		c.File(configuration.Files.Static.Index)
	})

	mediaWikiService := service.NewMediaWikiAPI()

	apiV1 := r.Group("/api/v1")
	apiV1.Use(gin.Logger(), gin.Recovery())
	{
		apiV1.GET("/points", getPoints(mediaWikiService))
	}

	// start the server
	return r.Run(configuration.Server.Port)
}
