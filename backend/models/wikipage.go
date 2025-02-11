package models

type WikiPage struct {
	ID    string  `json:"id"`
	Title string  `json:"title"`
	Lat   float64 `json:"lat"`
	Lon   float64 `json:"lon"`
}

type WikiPageSearchResponse struct {
	BatchComplete string `json:"batchcomplete"`
	Query         Query  `json:"query"`
}

type Query struct {
	Pages map[string]Page `json:"pages"`
}

type Page struct {
	PageID      int          `json:"pageid"`
	Ns          int          `json:"ns"`
	Title       string       `json:"title"`
	Coordinates []Coordinate `json:"coordinates"`
}

type Coordinate struct {
	Lat     float64 `json:"lat"`
	Lon     float64 `json:"lon"`
	Primary string  `json:"primary"`
	Globe   string  `json:"globe"`
}
