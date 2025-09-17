package api

import (
	"encoding/json"
	"fmt"
	"github.com/canghel3/geo-wiki/config"
	"github.com/canghel3/geo-wiki/services"
	"github.com/canghel3/telemetry/log"
	"net/http"
)

type Server struct {
	mux    *http.ServeMux
	config config.Configuration
}

func NewServer(config config.Configuration) *Server {
	return &Server{
		mux:    http.NewServeMux(),
		config: config,
	}
}

func (s *Server) Run() error {

	//static files (CSS, JS, etc.)
	fs := http.FileServer(http.Dir(s.config.Files.Static.Root))
	s.mux.Handle("/assets/", http.StripPrefix("/assets/", fs))

	//index page
	s.mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, s.config.Files.Static.Index)
	})

	mediaWikiService := services.GetMediaWikiAPIService()

	s.mux.Handle("/pages", getPagesWithinBounds(mediaWikiService))
	s.mux.Handle("/pages/views", getPagesViews(mediaWikiService))

	handler := recovery(logging(corsMiddleware(s.mux)))

	// start the server
	return http.ListenAndServe(fmt.Sprintf(":%d", s.config.Server.Port), handler)
}

func recovery(next http.Handler) http.Handler {
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

func logging(next http.Handler) http.Handler {
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

		// Handle preflight requests
		// The browser sends an OPTIONS request first to check if the actual request is safe to send.
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func errorResponse(w http.ResponseWriter, status int, message string, err error) {
	log.Stdout().Error().Logf("%d | %s", status, err.Error())
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	if err := json.NewEncoder(w).Encode(map[string]string{"message": message}); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func setResponse(w http.ResponseWriter, status int, content any) {
	w.Header().Set("Access-Control-Allow-Origin", "*") // Allow any origin
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	if err := json.NewEncoder(w).Encode(content); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
