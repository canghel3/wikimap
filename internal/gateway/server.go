package gateway

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/canghel3/telemetry/log"
	"github.com/canghel3/wikimap/internal/config"
	"github.com/canghel3/wikimap/internal/registry"
)

type APIGateway struct {
	config config.GatewayConfig
}

func NewAPIGateway(config config.GatewayConfig) *APIGateway {
	return &APIGateway{
		config: config,
	}
}

func (gw *APIGateway) ListenAndServe() error {
	serviceRegistry, err := registry.NewServiceRegistry(gw.config.Services)
	if err != nil {
		return err
	}

	v1 := newApiV1(serviceRegistry)

	mux := http.NewServeMux()
	mux.Handle("/api/v1/", http.StripPrefix("/api/v1", v1.handler()))

	handler := recoveryMiddleware(loggingMiddleware(corsMiddleware(mux)))

	// start the server
	return http.ListenAndServe(gw.config.Port, handler)
}

func recoveryMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				log.Stdout().Info().Logf("recovered from panic: %v", err)
				http.Error(w, fmt.Sprintf("encountered panic: %v", err), http.StatusInternalServerError)
			}
		}()

		next.ServeHTTP(w, r)
	})
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Stdout().Info().Logf("%s | %s | %s", r.RemoteAddr, r.Method, r.URL)
		next.ServeHTTP(w, r)
	})
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

		w.Header().Set("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type, X-CSRF-Token")

		w.Header().Set("Access-Control-Allow-Credentials", "true")

		// handle preflight requests
		// the browser sends an OPTIONS request first to check if the actual request is safe to send.
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

//func tokenMiddleware(next http.Handler) http.Handler {
//	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
//		ctx := context.Background()
//
//		// Construct the GoogleCredentials object which obtains the default configuration from your
//		// working environment.
//		credentials, err := google.FindDefaultCredentials(ctx)
//		if err != nil {
//			log.Stdout().Error().Logf("failed to find default credentials: %v", err)
//			return
//		}
//
//		var ts oauth2.TokenSource
//		if credentials != nil {
//			ts, err = idtoken.NewTokenSource(ctx, r.URL.String(), option.WithCredentials(credentials))
//			if err != nil {
//				log.Stdout().Error().Logf("failed to create token source: %v", err)
//				return
//			}
//		}
//
//		// Get the ID token.
//		// Once you've obtained the ID token, you can use it to make an authenticated call
//		// to the target audience.
//		var tk *oauth2.Token
//		if ts != nil {
//			tk, err = ts.Token()
//			if err != nil {
//				log.Stdout().Error().Logf("failed to get token: %v", err)
//			}
//		}
//
//		if tk != nil {
//			tk.SetAuthHeader(r)
//			log.Stdout().Info().Log("Generated ID token")
//		}
//		next.ServeHTTP(w, r)
//	})
//}

func errorResponse(w http.ResponseWriter, status int, message string, err error) {
	log.Stdout().Error().Logf("%d | %s", status, err.Error())
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	if err = json.NewEncoder(w).Encode(map[string]string{"message": message}); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func setResponse(w http.ResponseWriter, status int, content any) {
	w.Header().Set("Access-Control-Allow-Origin", "*") // allow any origin
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	if err := json.NewEncoder(w).Encode(content); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
