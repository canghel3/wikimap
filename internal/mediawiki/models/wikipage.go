package models

import (
	"sync"
)

type WikiPages struct {
	pages map[string]WikiPage
	lock  sync.RWMutex
}

type WikiPage struct {
	PageId string  `json:"pageid"`
	Views  uint    `json:"views"`
	Title  string  `json:"title"`
	Lat    float64 `json:"lat"`
	Lon    float64 `json:"lon"`
}

type WikiPageSearchResponse struct {
	BatchComplete string           `json:"batchcomplete"`
	Query         PagesSearchQuery `json:"query"`
}

type PagesSearchQuery struct {
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

type WikiPageViews map[string]uint64

type WikiPageViewsResponse struct {
	Query PagesViewsQuery `json:"query"`
}

type PagesViewsQuery struct {
	Pages map[string]PageViews `json:"pages"`
}

type PageViews struct {
	Views map[string]uint64 `json:"pageviews,omitempty"`
}

func (pv PageViews) Sum() uint64 {
	var sum uint64
	for _, views := range pv.Views {
		sum += views
	}

	return sum
}
