#!/usr/bin/env python3
"""Threaded static server for local development.

    python3 tools/serve.py                 # foreground, Ctrl-C to stop
    python3 tools/serve.py --daemon        # detach; survives closing the shell
    python3 tools/serve.py --status
    python3 tools/serve.py --stop

`python -m http.server` is single-threaded, which quietly breaks this site: the
browser fires the image preloads and the module graph at once, the big room image
monopolises the one handler, and the module requests fail with an opaque "failed
to fetch dynamically imported module". Threading it makes the problem disappear.

Also sends no-cache headers so an edit is always the thing you reload.

## Why --daemon exists

Backgrounding with `&` was not enough. A job started that way belongs to the
shell's process group, so it dies when that session is reaped - a closed
terminal, or an agent tool call finishing. `nohup` and `disown` only block
SIGHUP, so they do not survive a process-group kill either.

--daemon double-forks and calls setsid(), which puts the server in a brand new
session with no controlling terminal. Nothing that kills the parent's group can
reach it.

A launchd agent would additionally survive logout and reboot, and was tried
first. It does not work while this repo lives under ~/Downloads: launchd agents
do not inherit the file-access grant that Cursor and Terminal hold, so macOS TCC
denies the spawned process every read under that directory - it could not even
open its own venv's pyvenv.cfg. Moving the repo outside ~/Downloads would make
launchd viable; until then, this is the durable option that actually works.
"""

import argparse
import os
import signal
import sys
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PIDFILE = ROOT / ".serve.pid"
LOGFILE = ROOT / ".serve.log"


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".webp": "image/webp",
    }

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def log_message(self, fmt, *args):  # keep the console readable
        if "200" not in (args[1] if len(args) > 1 else ""):
            super().log_message(fmt, *args)


def running_pid() -> int | None:
    """The pid in the pidfile, if that process is still alive."""
    try:
        pid = int(PIDFILE.read_text().strip())
    except (FileNotFoundError, ValueError):
        return None
    try:
        os.kill(pid, 0)  # signal 0 only checks for existence
    except ProcessLookupError:
        PIDFILE.unlink(missing_ok=True)
        return None
    except PermissionError:
        pass  # alive, owned by someone else
    return pid


def daemonize() -> None:
    """Double-fork into a new session, so no parent's death can take us with it.

    The first fork lets the caller return immediately; setsid() then detaches
    from the terminal and the process group. The second fork ensures we are not
    a session leader, so the OS can never hand us a controlling terminal later.
    """
    if os.fork() > 0:
        os._exit(0)
    os.setsid()
    if os.fork() > 0:
        os._exit(0)

    sys.stdout.flush()
    sys.stderr.flush()
    log = os.open(LOGFILE, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o644)
    devnull = os.open(os.devnull, os.O_RDONLY)
    os.dup2(devnull, sys.stdin.fileno())
    os.dup2(log, sys.stdout.fileno())
    os.dup2(log, sys.stderr.fileno())
    PIDFILE.write_text(f"{os.getpid()}\n")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--daemon", action="store_true",
                    help="detach and keep serving after this shell exits")
    ap.add_argument("--stop", action="store_true")
    ap.add_argument("--status", action="store_true")
    ap.add_argument("--port", type=int, default=8765)
    # The published tree differs from the repo tree - build.py renames the pages
    # - so previewing a deploy means serving dist/, not the root you edit in.
    ap.add_argument("--dir", default=str(ROOT), help="directory to serve")
    args = ap.parse_args()

    if args.status:
        pid = running_pid()
        print(f"daemon: {'running, pid ' + str(pid) if pid else 'not running'}")
        print(f"log:    {LOGFILE.relative_to(ROOT)}")
        return

    if args.stop:
        pid = running_pid()
        if not pid:
            print("daemon: not running")
            return
        os.kill(pid, signal.SIGTERM)
        for _ in range(20):
            time.sleep(0.1)
            if running_pid() is None:
                break
        PIDFILE.unlink(missing_ok=True)
        print(f"daemon: stopped pid {pid}")
        return

    if args.daemon:
        existing = running_pid()
        if existing:
            print(f"daemon: already running, pid {existing}")
            return
        daemonize()

    root = Path(args.dir).resolve()
    server = ThreadingHTTPServer(("127.0.0.1", args.port), partial(Handler, directory=str(root)))
    print(f"serving {root} at http://localhost:{args.port}/  (?edit to calibrate hotspots)",
          flush=True)
    try:
        server.serve_forever()
    finally:
        if args.daemon:
            PIDFILE.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
