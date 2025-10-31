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
	return s.service.GetViews(ctx, request.Pageids...)
}

func (s *Server) GetPagesInBbox(ctx context.Context, request *mediawikipb.GetPagesInBboxRequest) (*mediawikipb.GetPagesInBboxResponse, error) {
	return s.service.GetPagesInBbox(ctx, request.Bbox)
}

func (s *Server) GetThumbnails(ctx context.Context, request *mediawikipb.GetThumbnailsRequest) (*mediawikipb.GetThumbnailsResponse, error) {
	return s.service.GetThumbnails(ctx, request.Width, request.Height, request.Pageids...)
}
