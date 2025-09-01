package customerrors

type NotFound struct {
	err error
}

func WrapNotFound(err error) *NotFound {
	return &NotFound{
		err: err,
	}
}

func (e *NotFound) Error() string {
	return e.err.Error()
}

func (e *NotFound) Wrap(err error) error {
	return e.err
}
