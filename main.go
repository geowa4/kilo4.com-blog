package main

import (
	"embed"
	"io/fs"
	"log"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

//go:embed pb_public/*
var staticFiles embed.FS

func main() {
	app := pocketbase.New()

	// Serve static files embedded in the binary
	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		public, _ := fs.Sub(staticFiles, "pb_public")
		se.Router.GET("/{path...}", apis.Static(public, false))
		return se.Next()
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
