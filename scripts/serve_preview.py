#!/usr/bin/env python3
"""Static preview server for the exported BeatForge web build.

`python -m http.server` is single-threaded, so one stalled connection blocks
every later request - which makes it unreliable behind the preview proxy. This
serves the same directory with a threading server, embed-friendly headers and
correct MIME types for the Expo/Hermes assets.
"""
import os
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "dist")


class Handler(SimpleHTTPRequestHandler):
    # HTTP/1.0 responses make some proxies close or buffer oddly; 1.1 keeps
    # connections well-formed for the preview proxy.
    protocol_version = "HTTP/1.1"

    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "application/javascript",
        ".mjs": "application/javascript",
        ".wav": "audio/wav",
        ".json": "application/json",
        ".hbc": "application/octet-stream",
        ".ttf": "font/ttf",
        ".woff": "font/woff",
        ".woff2": "font/woff2",
    }

    def end_headers(self):
        # Allow the preview proxy to embed and fetch this app.
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def send_response(self, *args, **kwargs):
        # Never emit X-Frame-Options; the preview renders inside an iframe.
        super().send_response(*args, **kwargs)

    def do_GET(self):
        # Single-page app fallback so deep links resolve to index.html.
        path = self.translate_path(self.path)
        if not os.path.exists(path) and "." not in os.path.basename(path):
            self.path = "/"
        return super().do_GET()

    def log_message(self, fmt, *args):
        sys.stdout.write("%s %s\n" % (self.address_string(), fmt % args))
        sys.stdout.flush()


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
    root = os.path.abspath(ROOT)
    if not os.path.isdir(root):
        sys.exit("dist/ not found - run: npm run web:export")
    server = ThreadingHTTPServer(("0.0.0.0", port), partial(Handler, directory=root))
    server.daemon_threads = True
    print(f"BeatForge preview serving {root} on http://0.0.0.0:{port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
