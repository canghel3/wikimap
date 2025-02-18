package api

import (
	"github.com/canghel3/geo-wiki/config"
	"github.com/canghel3/geo-wiki/service"
	"github.com/gin-gonic/gin"
)

func Run() error {
	r := gin.Default()

	configuration := config.AppConfig

	//static files (CSS, JS, etc.)
	r.Static("/assets", configuration.Files.Static.Root)

	//main HTML page
	r.GET("/", func(c *gin.Context) {
		c.File(configuration.Files.Static.Index)
	})

	mediaWikiService := service.NewMediaWikiAPI()

	apiV1 := r.Group("/api/v1")
	apiV1.Use(gin.Logger(), gin.Recovery())
	{
		apiV1.GET("/pages", getPagesWithinBounds(mediaWikiService))
		apiV1.GET("/pages/views", getPagesViews(mediaWikiService))
	}

	// start the server
	return r.Run(configuration.Server.Port)
}
