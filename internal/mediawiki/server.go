package mediawiki

import (
	"context"

	"github.com/canghel3/wikimap/internal/config"
	"github.com/canghel3/wikimap/proto/mediawikipb"
)

type Server struct {
	service *Service
	mediawikipb.UnimplementedMediaWikiServer
}

func NewServer(config config.MediaWikiConfig) *Server {
	return &Server{
		service: GetMediaWikiService(config),
	}
}

func (s *Server) GetViews(ctx context.Context, request *mediawikipb.GetViewsRequest) (*mediawikipb.GetViewsResponse, error) {
	views, err := s.service.GetViews(request.GetPageids()...)
	if err != nil {
		return nil, err
	}

	return translator.ViewsToProtobuf(views), nil
}
