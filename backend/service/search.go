package service

import (
	"encoding/json"
	"fmt"
	"github.com/canghel3/geo-wiki/config"
	"github.com/canghel3/geo-wiki/models"
	"io"
	"net/http"
	"strconv"
	"strings"
)

const (
	FormatJSON = "json"

	ViewsRequestBatchSize = 20
	DefaultGSLimit        = 100
	MinimumGSLimit        = 1
	MaximumGSLimit        = 500
)

type MediaWikiService struct {
	client *http.Client
	url    string
}

// TODO: implement options for url, client etc
func NewMediaWikiAPI() *MediaWikiService {
	mws := &MediaWikiService{
		client: http.DefaultClient,
		url:    config.AppConfig.MediaWiki.URL,
	}

	return mws
}

func (mws *MediaWikiService) GetViews(pageids ...string) (models.WikiPageViews, error) {
	var pagesWithViews = make(models.WikiPageViews)

	getViews := func(pageids ...string) error {
		withViews, err := mws.getViews(pageids...)
		if err != nil {
			return err
		}

		for k, v := range withViews {
			pagesWithViews[k] = v
		}

		return nil
	}

	if len(pageids) < ViewsRequestBatchSize {
		err := getViews(pageids...)
		if err != nil {
			return nil, err
		}

		return pagesWithViews, nil
	}

	for i := 0; i < cap(pageids); i += ViewsRequestBatchSize {
		var current []string
		if i+ViewsRequestBatchSize > cap(pageids) {
			current = pageids[i:]
		} else {
			current = pageids[i : i+ViewsRequestBatchSize]
		}

		err := getViews(current...)
		if err != nil {
			return nil, err
		}
	}

	return pagesWithViews, nil
}

func (mws *MediaWikiService) getViews(pages ...string) (models.WikiPageViews, error) {
	request, err := http.NewRequest(http.MethodGet, mws.url, nil)
	if err != nil {
		return nil, err
	}

	q := request.URL.Query()
	q.Add("action", "query")
	q.Add("prop", "pageviews")
	q.Add("pageids", strings.Join(pages, "|"))
	q.Add("format", "json")

	request.URL.RawQuery = q.Encode()

	response, err := mws.client.Do(request)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	content, err := io.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}

	switch response.StatusCode {
	case http.StatusOK:
		var viewsResponse models.WikiPageViewsResponse
		err = json.Unmarshal(content, &viewsResponse)
		if err != nil {
			return nil, err
		}

		var pagesWithViews = make(models.WikiPageViews)
		for id, views := range viewsResponse.Query.Pages {
			pagesWithViews[id] = views.Sum()
		}

		return pagesWithViews, nil
	default:
		return nil, fmt.Errorf("status code: %d; with message: %s", response.StatusCode, string(content))
	}
}

func (mws *MediaWikiService) SearchWikiPages(bbox string) ([]models.WikiPage, error) {
	request, err := http.NewRequest(http.MethodGet, mws.url, nil)
	if err != nil {
		return nil, err
	}

	q := request.URL.Query()
	q.Add("action", "query")
	q.Add("list", "geosearch")
	q.Add("gsbbox", bbox)
	q.Add("gslimit", "500")
	q.Add("format", "json")

	request.URL.RawQuery = q.Encode()

	response, err := mws.client.Do(request)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	content, err := io.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}

	switch response.StatusCode {
	case http.StatusOK:
		var searchResponse models.WikiPageSearchResponse
		err = json.Unmarshal(content, &searchResponse)
		if err != nil {
			return nil, err
		}

		var pages []models.WikiPage
		for _, page := range searchResponse.Query.Geosearch {
			pages = append(pages, models.WikiPage{
				PageId: strconv.Itoa(page.PageID),
				Title:  page.Title,
				Lat:    page.Lat,
				Lon:    page.Lon,
			})
		}

		return pages, nil
	default:
		return nil, fmt.Errorf("status code: %d; with message: %s", response.StatusCode, string(content))
	}
}
