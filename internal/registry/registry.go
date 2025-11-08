package registry

import (
	"fmt"
	"time"

	"github.com/canghel3/telemetry/log"
	"github.com/canghel3/wikimap/internal/config"
	"github.com/canghel3/wikimap/proto/mediawikipb"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

const MediaWikiServiceName = "mediawiki"
const defaultTimeout = 5 * time.Second

type ServiceRegistry struct {
	mediawiki mediawikipb.MediaWikiClient
}

func NewServiceRegistry(config config.ServicesConfig) (*ServiceRegistry, error) {
	mediawiki, err := newMediaWikiClient(config)
	if err != nil {
		return nil, err
	}

	sr := &ServiceRegistry{
		mediawiki: mediawiki,
	}

	log.Stdout().Info().Log("initialized service registry")
	return sr, nil
}

func (sr *ServiceRegistry) GetMediaWikiClient() mediawikipb.MediaWikiClient {
	return sr.mediawiki
}

func newMediaWikiClient(config config.ServicesConfig) (mediawikipb.MediaWikiClient, error) {
	if !config.Has(MediaWikiServiceName) {
		return nil, fmt.Errorf("%s service not configured", MediaWikiServiceName)
	}

	mediaWikiInfo := config.Get(MediaWikiServiceName)
	conn, err := grpc.NewClient(
		mediaWikiInfo.Url,
		grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}

	return mediawikipb.NewMediaWikiClient(conn), nil
}
