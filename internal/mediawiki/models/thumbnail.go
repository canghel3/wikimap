package models

type WikiPageThumbnailResponse struct {
	Query WikiPageThumbnailQuery `json:"query"`
}

type WikiPageThumbnailQuery struct {
	Pages map[string]WikiPageThumbnailPage `json:"pages"`
}

type WikiPageThumbnailPage struct {
	PageID    int               `json:"pageid"`
	Title     string            `json:"title"`
	Thumbnail WikiPageThumbnail `json:"thumbnail"`
}

type WikiPageThumbnail struct {
	Source string `json:"source"`
	Width  int    `json:"width"`
	Height int    `json:"height"`
}

type WikiPageThumbnails map[string]WikiPageThumbnail
