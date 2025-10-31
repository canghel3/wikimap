package gateway

import (
	"github.com/canghel3/wikimap/internal/gateway/models"
	"github.com/canghel3/wikimap/proto/mediawikipb"
	"golang.org/x/exp/maps"
)

var translator *ProtobufTranslator

func init() {
	translator = &ProtobufTranslator{}
}

type ProtobufTranslator struct{}

func (pt *ProtobufTranslator) ProtobufToPageViews(pb *mediawikipb.GetViewsResponse) models.WikiPageViews {
	var pv = make(models.WikiPageViews)
	maps.Copy(pv, pb.PageViews)
	return pv
}

func (pt *ProtobufTranslator) ProtobufToPageThumbnails(pb *mediawikipb.GetThumbnailsResponse) models.WikiPageThumbnails {
	var pv = make(models.WikiPageThumbnails)
	for k, v := range pb.Thumbnails {
		pv[k] = models.WikiPageThumbnail{
			Source: v.Source,
			Width:  v.Width,
			Height: v.Height,
		}
	}

	return pv
}

func (pt *ProtobufTranslator) ProtobufToWikiPages(pb *mediawikipb.GetPagesInBboxResponse) []models.WikiPage {
	var pages = make([]models.WikiPage, len(pb.Pages))
	for i, p := range pb.Pages {
		pages[i] = models.WikiPage{
			PageId: p.Title,
			Views:  p.Views,
			Title:  p.Title,
			Lat:    p.Lat,
			Lon:    p.Lon,
		}
	}

	return pages
}
