package api

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/canghel3/geo-wiki/services"
)

func getPagesWithinBounds(mediaWikiService *services.MediaWikiAPIService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		bbox := r.URL.Query().Get("bbox")
		if len(strings.Split(bbox, "|")) != 4 {
			errorResponse(w, http.StatusBadRequest, "bbox format error", fmt.Errorf("bbox format error: %s", bbox))
			return
		}

		pages, err := mediaWikiService.SearchWikiPages(bbox)
		if err != nil {
			errorResponse(w, http.StatusInternalServerError, "error searching wiki pages", fmt.Errorf("error searching wiki pages: %v", err))
			return
		}

		setResponse(w, http.StatusOK, pages)
	}
}

func getPagesViews(mediaWikiService *services.MediaWikiAPIService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		queryIds := r.URL.Query().Get("ids")

		ids := strings.Split(queryIds, ",")
		if len(ids) < 1 {
			errorResponse(w, http.StatusBadRequest, "id format error", fmt.Errorf("id format error: %s", queryIds))
			return
		}

		views, err := mediaWikiService.GetViews(ids...)
		if err != nil {
			errorResponse(w, http.StatusInternalServerError, "error getting views", fmt.Errorf("error getting views: %v", err))
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
