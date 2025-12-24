.PHONY: content-build content-watch content-clean build run clean

# Content (Hugo) targets
content-build:
	hugo --minify

content-watch:
	hugo --minify --watch

content-clean:
	rm -rf pb_public

# Go targets (depend on content)
build: content-build
	go build -o pocketbase

run: build
	./pocketbase serve

clean: content-clean
	rm -f pocketbase
