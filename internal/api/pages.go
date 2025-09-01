package api

import (
	"errors"
	"github.com/canghel3/geo-wiki/service"
	"github.com/canghel3/telemetry/log"
	"net/http"
	"strconv"
	"strings"
)

func getPagesWithinBounds(mediaWikiService *service.MediaWikiAPIService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		bbox := r.URL.Query().Get("bbox")
		if len(strings.Split(bbox, "|")) != 4 {
			log.Stdout().Error().Logf("bbox format error: %s", bbox)
			errorResponse(w, http.StatusBadRequest, "bbox format error")
			return
		}

		pages, err := mediaWikiService.SearchWikiPages(bbox)
		if err != nil {
			log.Stdout().Error().Logf("error searching wiki pages: %v", err)
			errorResponse(w, http.StatusInternalServerError, "error searching wiki pages")
			return
		}

		setResponse(w, http.StatusOK, pages)
	}
}

func getPagesViews(mediaWikiService *service.MediaWikiAPIService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		queryIds := r.URL.Query().Get("ids")

		ids := strings.Split(queryIds, ",")
		if len(ids) < 1 {
			log.Stdout().Error().Logf("id format error: %s", queryIds)
			errorResponse(w, http.StatusBadRequest, "id format error")
			return
		}

		views, err := mediaWikiService.GetViews(ids...)
		if err != nil {
			log.Stdout().Error().Logf("error getting views: %v", err)
			errorResponse(w, http.StatusInternalServerError, "error getting views")
			return
		}

		setResponse(w, http.StatusOK, views)
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
