package api

import (
	"errors"
	"github.com/canghel3/geo-wiki/service"
	"github.com/canghel3/telemetry/log"
	"github.com/gin-gonic/gin"
	"net/http"
	"strconv"
	"strings"
)

func getPagesWithinBounds(mediaWikiService *service.MediaWikiService) func(c *gin.Context) {
	return func(c *gin.Context) {
		bbox := c.Query("bbox")
		if len(strings.Split(bbox, "|")) != 4 {
			log.Stdout().Error().Logf("bbox format error: %s", bbox)
			c.JSON(http.StatusBadRequest, gin.H{"message": "bbox format error"})
			return
		}

		pages, err := mediaWikiService.SearchWikiPages(bbox)
		if err != nil {
			log.Stdout().Error().Logf("error searching wiki pages: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Error searching wiki pages"})
			return
		}

		c.JSON(http.StatusOK, pages)
	}
}

func getPagesViews(mediaWikiService *service.MediaWikiService) func(c *gin.Context) {
	return func(c *gin.Context) {
		ids := strings.Split(c.Query("ids"), ",")
		if len(ids) < 1 {
			log.Stdout().Error().Logf("id format error: %s", c.Query("ids"))
			c.JSON(http.StatusBadRequest, gin.H{"message": "id format error"})
			return
		}

		views, err := mediaWikiService.GetViews(ids...)
		if err != nil {
			log.Stdout().Error().Logf("error getting views: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Error getting views"})
			return
		}

		c.JSON(http.StatusOK, views)
	}
}

func parseBBOXQuery(bbox string) ([4]float64, error) {
	parts := strings.Split(bbox, ",")
	if len(parts) != 4 {
		return [4]float64{}, errors.New("invalid bbox query, requires 4 parts after splitting by ',' (comma)")
	}

	var result [4]float64
	for i, part := range parts {
		parsed, err := strconv.ParseFloat(part, 64)
		if err != nil {
			return [4]float64{}, err
		}

		result[i] = parsed
	}

	return result, nil
}
