package services

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"sync"

	"github.com/canghel3/geo-wiki/config"
	"github.com/canghel3/geo-wiki/models"
	"golang.org/x/time/rate"
)

const (
	ViewsRequestBatchSize = 20
	DefaultGSLimit        = 100
	MinimumGSLimit        = 1
	MaximumGSLimit        = "500"

	UserAgent = "GeoWiki/0.0 (cristian.anghel4@gmail.com) https://github.com/canghel3/geo-wiki"
)

var (
	mediaWikiOnce    sync.Once
	mediaWikiService *MediaWikiAPIService
)

type MediaWikiAPIService struct {
	client      *http.Client
	url         string
	rateLimiter *rate.Limiter
}

func GetMediaWikiAPIService() *MediaWikiAPIService {
	mediaWikiOnce.Do(func() {
		mediaWikiService = &MediaWikiAPIService{
			client:      http.DefaultClient,
			url:         config.Root.MediaWiki.URL,
			rateLimiter: rate.NewLimiter(rate.Limit(config.Root.MediaWiki.Rate), config.Root.MediaWiki.Burst),
		}
	})

	return mediaWikiService
}

func (mws *MediaWikiAPIService) GetViews(pageids ...string) (models.WikiPageViews, error) {
	err := mws.rateLimiter.Wait(context.Background())
	if err != nil {
		return nil, err
	}

	pagesWithViews := make(models.WikiPageViews)

	for i := 0; i < len(pageids); i += ViewsRequestBatchSize {
		end := i + ViewsRequestBatchSize
		if end > len(pageids) {
			end = len(pageids)
		}

		withViews, err := mws.getViews(pageids[i:end]...)
		if err != nil {
			return nil, err
		}

		for k, v := range withViews {
			pagesWithViews[k] = v
		}
	}

	return pagesWithViews, nil
}

func (mws *MediaWikiAPIService) getViews(pages ...string) (models.WikiPageViews, error) {
	request, err := http.NewRequest(http.MethodGet, mws.url, nil)
	if err != nil {
		return nil, err
	}

	request.Header.Add("User-Agent", UserAgent)

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
		return nil, fmt.Errorf("http status: %d\nmessage: %s", response.StatusCode, string(content))
	}
}

// SearchWikiPages searches for wikipedia pages within a given bbox. Bbox format is of the form maxy|minx|miny|maxx
func (mws *MediaWikiAPIService) SearchWikiPages(bbox string) ([]models.WikiPage, error) {
	err := mws.rateLimiter.Wait(context.Background())
	if err != nil {
		return nil, err
	}

	request, err := http.NewRequest(http.MethodGet, mws.url, nil)
	if err != nil {
		return nil, err
	}

	request.Header.Add("User-Agent", UserAgent)

	q := request.URL.Query()
	q.Add("action", "query")
	q.Add("list", "geosearch")
	q.Add("gsbbox", bbox)
	q.Add("gslimit", MaximumGSLimit)
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
		return nil, fmt.Errorf("http status: %d\nmessage: %s", response.StatusCode, string(content))
	}
}

func (mws *MediaWikiAPIService) GetThumbnails(width uint, pageids ...string) (models.WikiPageThumbnails, error) {
	err := mws.rateLimiter.Wait(context.Background())
	if err != nil {
		return nil, err
	}

	thumbnails := make(models.WikiPageThumbnails)

	for i := 0; i < len(pageids); i += ViewsRequestBatchSize {
		end := i + ViewsRequestBatchSize
		if end > len(pageids) {
			end = len(pageids)
		}

		withThumbnails, err := mws.getThumbnails(width, pageids[i:end]...)
		if err != nil {
			return nil, err
		}

		for k, v := range withThumbnails {
			thumbnails[k] = v
		}
	}

	return thumbnails, nil
}

func (mws *MediaWikiAPIService) getThumbnails(width uint, pageids ...string) (models.WikiPageThumbnails, error) {
	request, err := http.NewRequest(http.MethodGet, mws.url, nil)
	if err != nil {
		return nil, err
	}

	request.Header.Add("User-Agent", UserAgent)

	q := request.URL.Query()
	q.Add("action", "query")
	q.Add("prop", "pageimages")
	q.Add("pageids", strings.Join(pageids, "|"))
	q.Add("pithumbsize", strconv.Itoa(int(width)))
	q.Add("format", "json")
	q.Add("origin", "*")

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
		var thumbnailResponse models.WikiPageThumbnailResponse
		err = json.Unmarshal(content, &thumbnailResponse)
		if err != nil {
			return nil, err
		}

		var thumbnails = make(models.WikiPageThumbnails)
		for id, thumbnailPage := range thumbnailResponse.Query.Pages {
			thumbnails[id] = thumbnailPage.Thumbnail
		}

		return thumbnails, nil
	default:
		return nil, fmt.Errorf("http status: %d\nmessage: %s", response.StatusCode, string(content))
	}
}
