package models

type WikiPage struct {
	PageId string  `json:"pageid"`
	Views  uint64  `json:"views"`
	Title  string  `json:"title"`
	Lat    float32 `json:"lat"`
	Lon    float32 `json:"lon"`
}

type WikiPageViews map[string]uint64

type WikiPageThumbnails map[string]WikiPageThumbnail

type WikiPageThumbnail struct {
	Source string `json:"source"`
	Width  uint32 `json:"width"`
	Height uint32 `json:"height"`
}
