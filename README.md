# WithKoeni Collection

Some random tools and APIs that might be useful.

## APIs

### Identicon

Generate reproducible, human-differentiable images for any value. Uses [jdenticon](https://jdenticon.com/).

[Documentation can be found here.](https://with.koeni.dev/identicon)

### CORS Proxy

Very simple CORS proxy, currently hardcoded new allowed domains.

## Self-Host

The WithKoeni collection is ready to be dockerized. To deploy it on any docker system:

`docker run -it $(docker build -q https://github.com/koenidv/with.koeni.dev.git -p 3000:3000)`
