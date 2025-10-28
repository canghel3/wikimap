package mediawiki

import (
	"github.com/canghel3/wikimap/internal/mediawiki/models"
	"github.com/canghel3/wikimap/proto/mediawikipb"
)

var translator *ProtobufTranslator

func init() {
	translator = &ProtobufTranslator{}
}

type ProtobufTranslator struct{}

func (pt *ProtobufTranslator) ViewsToProtobuf(views models.WikiPageViews) *mediawikipb.GetViewsResponse {
	return &mediawikipb.GetViewsResponse{PageViews: views}
}
