package api

import (
	"encoding/json"
	"fmt"
	"github.com/Ginger955/telemetry/log"
	"github.com/canghel3/geo-wiki/config"
	"net/http"
	"strconv"

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

	// Serve static files (CSS, JS, etc.)
	r.Static("/assets", configuration.Files.Static.Root)

	// Serve the main HTML page
	r.GET("/", func(c *gin.Context) {
		c.File(configuration.Files.Static.Index)
	})

	apiV1 := r.Group("/api/v1")
	apiV1.Use(gin.Logger(), gin.Recovery())
	{

	}
	// Endpoint to provide map points
	r.GET("/points", func(c *gin.Context) {
		points := []Point{
			{Lat: 51.5, Lon: -0.09, Name: "PointSQL 1", Description: "Description for PointSQL 1"},
			{Lat: 51.51, Lon: -0.1, Name: "PointSQL 2", Description: "Description for PointSQL 2"},
			{Lat: 51.49, Lon: -0.08, Name: "PointSQL 3", Description: "Description for PointSQL 3"},
		}
		c.JSON(http.StatusOK, points)
	})
	r.GET("/get-geojson", getGeoJSONHandler)

	// Start the server
	return r.Run(":8082")
}

// Example GeoJSON FeatureCollection
type GeoJSONFeatureCollection struct {
	Type     string                   `json:"type"`
	Features []map[string]interface{} `json:"features"`
}

type BBoxQuery struct {
	North float64
	South float64
	East  float64
	West  float64
	Zoom  int
}

func getGeoJSONHandler(c *gin.Context) {
	// Parse query parameters sent by HTMX
	north, _ := strconv.ParseFloat(c.Query("north"), 64)
	south, _ := strconv.ParseFloat(c.Query("south"), 64)
	east, _ := strconv.ParseFloat(c.Query("east"), 64)
	west, _ := strconv.ParseFloat(c.Query("west"), 64)
	zoom, _ := strconv.Atoi(c.Query("zoom"))

	bbox := BBoxQuery{North: north, South: south, East: east, West: west, Zoom: zoom}
	fmt.Printf("Requested BBox: %+v\n", bbox)

	// Query your spatial database or filter your data according to bbox and zoom
	// Here we return a dummy feature collection

	fc := GeoJSONFeatureCollection{
		Type: "FeatureCollection",
		Features: []map[string]interface{}{
			{
				"type": "Feature",
				"geometry": map[string]interface{}{
					"type":        "PointSQL",
					"coordinates": []float64{-0.09, 51.505},
				},
				"properties": map[string]interface{}{
					"name": "A Sample PointSQL",
					"id":   1,
				},
			},
		},
	}

	c.Header("Content-Type", "application/json")
	json.NewEncoder(c.Writer).Encode(fc)
}
