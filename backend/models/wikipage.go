package models

type WikiPages []WikiPage

func (w WikiPages) IDs() []string {
	ids := make([]string, len(w))
	for i, page := range w {
		ids[i] = page.PageId
	}

	return ids
}

func (w WikiPages) Get(id string) *WikiPage {
	for _, page := range w {
		if page.PageId == id {
			return &page
		}
	}

	return nil
}

func (w WikiPages) Update(id string, v *WikiPage) {
	if v == nil {
		return
	}

	for i := 0; i < len(w); i++ {
		if w[i].PageId == id {
			w[i] = *v
			return
		}
	}
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

type WikiPageViews map[string]uint

type WikiPageViewsResponse struct {
	Query PagesViewsQuery `json:"query"`
}

type PagesViewsQuery struct {
	Pages map[string]PageViews `json:"pages"`
}

type PageViews struct {
	Views map[string]*int `json:"pageviews,omitempty"`
}

func (pv PageViews) Sum() uint {
	var sum uint
	for _, views := range pv.Views {
		if views != nil {
			sum += uint(*views)
		}
	}

	return sum
}
