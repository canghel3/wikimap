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
	Geosearch []Geosearch `json:"geosearch"`
}

type Geosearch struct {
	PageID  int     `json:"pageid"`
	NS      int     `json:"ns"`
	Title   string  `json:"title"`
	Lat     float64 `json:"lat"`
	Lon     float64 `json:"lon"`
	Dist    float64 `json:"dist"`
	Primary string  `json:"primary"`
}
