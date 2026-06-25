package main

import (
	"embed"
	"log"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

const (
	Version   = "1.1.1"
	PublicURL = "https://docshift.tonycletus.com"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed build/appicon.png
var icon []byte

func main() {
	app := NewApp()

	err := wails.Run(&options.App{
		Title:     "DocShift",
		Width:     1180,
		Height:    820,
		MinWidth:  900,
		MinHeight: 640,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 255, G: 255, B: 255, A: 1},
		OnStartup:        app.startup,
		Windows: &windows.Options{
			DisableWindowIcon: false,
		},
		Mac: &mac.Options{
			About: &mac.AboutInfo{
				Title:   "DocShift",
				Message: "Free, private, open-source PDF tools",
				Icon:    icon,
			},
		},
		Bind: []interface{}{
			app,
		},
	})
	if err != nil {
		log.Fatal("DocShift failed to start: ", err)
	}
}
