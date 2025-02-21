package storage

type Storage interface {
	BookmarkOperations
}

type BookmarkOperations interface {
	//Add(bookmark *models.Bookmark) (*models.Bookmark, error)
}
