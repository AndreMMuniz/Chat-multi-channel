"""
Standalone worker entrypoint.

Run with:  python -m src.worker.main

Useful for running the agent worker as a separate process (e.g., Railway worker dyno)
while the FastAPI server runs separately.
"""

import asyncio
import signal
import logging

from src.shared.observability import setup_logging
from src.worker.consumer import start_workers, stop_workers

log = logging.getLogger(__name__)


async def main() -> None:
    setup_logging()
    log.info("Starting agent worker process")

    tasks = await start_workers()

    loop = asyncio.get_running_loop()
    stop_event = asyncio.Event()

    def _handle_signal():
        log.info("Shutdown signal received")
        stop_event.set()

    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, _handle_signal)

    await stop_event.wait()
    await stop_workers(tasks)
    log.info("Worker process exited cleanly")


if __name__ == "__main__":
    asyncio.run(main())
