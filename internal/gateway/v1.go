package gateway

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/canghel3/wikimap/internal/registry"
	"github.com/canghel3/wikimap/proto/mediawikipb"
)

type apiV1 struct {
	serviceRegistry *registry.ServiceRegistry
}

func newApiV1(registry *registry.ServiceRegistry) *apiV1 {
	return &apiV1{
		serviceRegistry: registry,
	}
}

func (v1 *apiV1) handler() http.Handler {
	mux := http.NewServeMux()

	mux.Handle("/pages", v1.pagesInBbox())
	mux.Handle("/pages/views", v1.pagesViews())
	mux.Handle("/pages/thumbnails", v1.pagesThumbnails())

	return mux
}

func (v1 *apiV1) pagesViews() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		queryIds := r.URL.Query().Get("ids")

		ids := strings.Split(queryIds, ",")
		if len(ids) < 1 {
			errorResponse(w, http.StatusBadRequest, "id format error", fmt.Errorf("id format error: %s", queryIds))
			return
		}

		views, err := v1.serviceRegistry.GetMediaWikiClient().GetViews(r.Context(), &mediawikipb.GetViewsRequest{Pageids: ids})
		if err != nil {
			errorResponse(w, http.StatusInternalServerError, "error getting views", fmt.Errorf("error getting views: %v", err))
			return
		}

		setResponse(w, http.StatusOK, translator.ProtobufToPageViews(views))
	}
}

func (v1 *apiV1) pagesInBbox() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		bbox := r.URL.Query().Get("bbox")
		if len(strings.Split(bbox, "|")) != 4 {
			errorResponse(w, http.StatusBadRequest, "bbox format error", fmt.Errorf("bbox format error: %s", bbox))
			return
		}

		pages, err := v1.serviceRegistry.GetMediaWikiClient().GetPagesInBbox(r.Context(), &mediawikipb.GetPagesInBboxRequest{
			Bbox: bbox,
		})
		if err != nil {
			errorResponse(w, http.StatusInternalServerError, "error searching wiki pages", fmt.Errorf("error searching wiki pages: %v", err))
			return
		}

		setResponse(w, http.StatusOK, translator.ProtobufToWikiPages(pages))
	}
}

func (v1 *apiV1) pagesThumbnails() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		queryIds := r.URL.Query().Get("ids")
		widthQuery := r.URL.Query().Get("width")

		if len(widthQuery) < 1 {
			errorResponse(w, http.StatusBadRequest, "width is required", fmt.Errorf("width is required"))
			return
		}

		width, err := strconv.ParseUint(widthQuery, 10, 32)
		if err != nil {
			errorResponse(w, http.StatusBadRequest, "width must be greater than 0", fmt.Errorf("width format error: %v", err))
			return
		}

		ids := strings.Split(queryIds, ",")
		if len(ids) < 1 {
			errorResponse(w, http.StatusBadRequest, "ids are required", fmt.Errorf("ids are required"))
			return
		}

		thumbnails, err := v1.serviceRegistry.GetMediaWikiClient().GetThumbnails(r.Context(), &mediawikipb.GetThumbnailsRequest{
			Width:   uint32(width),
			Pageids: ids,
		})
		if err != nil {
			errorResponse(w, http.StatusInternalServerError, "error getting thumbnails", fmt.Errorf("error getting thumbnails: %v", err))
			return
		}

		setResponse(w, http.StatusOK, translator.ProtobufToPageThumbnails(thumbnails))
	}
}
