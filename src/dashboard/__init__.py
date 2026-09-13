"""Dashboard web server package."""


def run_server(*args, **kwargs):
    from .server import run_server as _run_server

    return _run_server(*args, **kwargs)


__all__ = ["run_server"]
