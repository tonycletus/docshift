package main

import "context"

type App struct {
	ctx context.Context
}

type AppInfo struct {
	Name      string `json:"name"`
	Version   string `json:"version"`
	PublicURL string `json:"publicUrl"`
	Mode      string `json:"mode"`
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) Info() AppInfo {
	return AppInfo{
		Name:      "DocShift",
		Version:   Version,
		PublicURL: PublicURL,
		Mode:      "desktop",
	}
}
