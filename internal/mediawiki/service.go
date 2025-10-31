package mediawiki

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"sync"

	"github.com/canghel3/wikimap/internal/config"
	"github.com/canghel3/wikimap/internal/mediawiki/models"
	"github.com/canghel3/wikimap/proto/mediawikipb"
	"golang.org/x/time/rate"
)

const (
	RequestBatchSize = 20
	DefaultGSLimit   = 100
	MinimumGSLimit   = 1
	MaximumGSLimit   = "500"

	UserAgent = "WikiMap/0.0 (cristian.anghel4@gmail.com) https://github.com/canghel3/wikimap"
)

var (
	mediaWikiOnce    sync.Once
	mediaWikiService *Service
)

type Service struct {
	client      *http.Client
	url         string
	rateLimiter *rate.Limiter
}

func GetMediaWikiService(config config.MediaWikiConfig) *Service {
	mediaWikiOnce.Do(func() {
		mediaWikiService = &Service{
			client:      http.DefaultClient,
			url:         config.WikiConfig.URL,
			rateLimiter: rate.NewLimiter(rate.Limit(config.WikiConfig.Rate), config.WikiConfig.Burst),
		}
	})

	return mediaWikiService
}

func (mws *Service) GetViews(ctx context.Context, pageids ...string) (*mediawikipb.GetViewsResponse, error) {
	err := mws.rateLimiter.Wait(ctx)
	if err != nil {
		return nil, err
	}

	pagesWithViews := new(mediawikipb.GetViewsResponse)
	pagesWithViews.PageViews = make(models.WikiPageViews)

	for i := 0; i < len(pageids); i += RequestBatchSize {
		end := i + RequestBatchSize
		if end > len(pageids) {
			end = len(pageids)
		}

		withViews, err := mws.getViews(pageids[i:end]...)
		if err != nil {
			return nil, err
		}

		for k, v := range withViews {
			pagesWithViews.PageViews[k] = v
		}
	}

	return pagesWithViews, nil
}

func (mws *Service) getViews(pages ...string) (models.WikiPageViews, error) {
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

// GetPagesInBbox searches for wikipedia pages within a given bbox. Bbox format is of the form maxy|minx|miny|maxx
func (mws *Service) GetPagesInBbox(ctx context.Context, bbox string) (*mediawikipb.GetPagesInBboxResponse, error) {
	err := mws.rateLimiter.Wait(ctx)
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

		var pages = new(mediawikipb.GetPagesInBboxResponse)
		pages.Pages = make([]*mediawikipb.WikiPageMetadata, 0)
		for _, page := range searchResponse.Query.Geosearch {
			pages.Pages = append(pages.Pages, &mediawikipb.WikiPageMetadata{
				Pageid: strconv.Itoa(page.PageID),
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

func (mws *Service) GetThumbnails(ctx context.Context, width, height uint32, pageids ...string) (*mediawikipb.GetThumbnailsResponse, error) {
	err := mws.rateLimiter.Wait(ctx)
	if err != nil {
		return nil, err
	}

	thumbnails := new(mediawikipb.GetThumbnailsResponse)
	thumbnails.Thumbnails = make(map[string]*mediawikipb.ThumbnailData)

	for i := 0; i < len(pageids); i += RequestBatchSize {
		end := i + RequestBatchSize
		if end > len(pageids) {
			end = len(pageids)
		}

		withThumbnails, err := mws.getThumbnails(width, pageids[i:end]...)
		if err != nil {
			return nil, err
		}

		for k, v := range withThumbnails {
			thumbnails.Thumbnails[k] = &mediawikipb.ThumbnailData{
				Source: v.Source,
				Width:  v.Width,
				Height: v.Height,
			}
		}
	}

	return thumbnails, nil
}

func (mws *Service) getThumbnails(width uint32, pageids ...string) (models.WikiPageThumbnails, error) {
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
