package registry

import (
	"context"
	"fmt"
	"net/url"
	"time"

	"github.com/canghel3/telemetry/log"
	"github.com/canghel3/wikimap/internal/config"
	"github.com/canghel3/wikimap/proto/mediawikipb"
	"google.golang.org/api/idtoken"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	grpcMetadata "google.golang.org/grpc/metadata"
)

const MediaWikiServiceName = "mediawiki"
const defaultTimeout = 5 * time.Second

// ServiceRegistry holds all available client clients for each microservice.
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
	parsedUrl, err := url.Parse(mediaWikiInfo.Url)
	if err != nil {
		return nil, err
	}

	log.Stdout().Info().Logf("parsed url host: %s", parsedUrl.Host)

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Create an identity token.
	// With a global TokenSource tokens would be reused and auto-refreshed at need.
	// A given TokenSource is specific to the audience.
	tokenSource, err := idtoken.NewTokenSource(ctx, parsedUrl.String())
	if err != nil {
		return nil, fmt.Errorf("idtoken.NewTokenSource: %w", err)
	}
	token, err := tokenSource.Token()
	if err != nil {
		return nil, fmt.Errorf("TokenSource.Token: %w", err)
	}

	//TODO: handle closing grpc conn via resource closer struct
	conn, err := grpc.NewClient(parsedUrl.Host,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithUnaryInterceptor(authInterceptor(token.AccessToken)),
		grpc.WithUnaryInterceptor(loggingInterceptor()))
	if err != nil {
		return nil, err
	}

	return mediawikipb.NewMediaWikiClient(conn), nil
}

func authInterceptor(token string) grpc.UnaryClientInterceptor {
	return func(ctx context.Context, method string, req, reply any, cc *grpc.ClientConn, invoker grpc.UnaryInvoker, opts ...grpc.CallOption) error {
		ctx = grpcMetadata.AppendToOutgoingContext(ctx, "Authorization", "Bearer "+token)
		return invoker(ctx, method, req, reply, cc, opts...)
	}
}

func loggingInterceptor() grpc.UnaryClientInterceptor {
	return func(ctx context.Context, method string, req, reply any, cc *grpc.ClientConn, invoker grpc.UnaryInvoker, opts ...grpc.CallOption) error {
		log.Stdout().Info().Logf("%s | %v | %v", method, req, reply)
		return invoker(ctx, method, req, reply, cc, opts...)
	}
}
