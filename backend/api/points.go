package api

import (
	"errors"
	"github.com/gin-gonic/gin"
	"net/http"
	"strconv"
	"strings"
)

func getPoints() func(c *gin.Context) {
	return func(c *gin.Context) {
		bbox, err := parseBBOXQuery(c.Query("bbox"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return
		}

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
