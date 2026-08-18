"""
Server Logging System for STL-Manager
Handles thread-safe stdout/stderr Tee interception, log rotation, ANSI cleaning,
and instant flushing for visible and hidden portable executions.
"""

import sys
import os
import re
import io
import time
import logging
import threading
from pathlib import Path
from typing import List, Dict, Any, Optional
from collections import deque

ROOT_DIR = Path(__file__).resolve().parent.parent
LOGS_DIR = ROOT_DIR / "logs"
LOG_FILE = LOGS_DIR / "backend.log"
MAX_LOG_BYTES = 10 * 1024 * 1024  # 10 MB per file
BACKUP_COUNT = 5                  # Keep backend.log.1 ... backend.log.5

ANSI_REGEX = re.compile(r'\x1b\[[0-9;]*[a-zA-Z]')


class RotatingLogWriter:
    """Thread-safe file writer with automatic size-based rotation and immediate flushing."""

    def __init__(self, log_file: Path, max_bytes: int = MAX_LOG_BYTES, backup_count: int = BACKUP_COUNT):
        self.log_file = log_file
        self.max_bytes = max_bytes
        self.backup_count = backup_count
        self.lock = threading.RLock()
        self._file = None
        self._ensure_file_open()

    def _ensure_file_open(self):
        try:
            self.log_file.parent.mkdir(parents=True, exist_ok=True)
            if self._file is None or self._file.closed:
                self._file = open(self.log_file, "a", encoding="utf-8", errors="replace")
        except Exception as e:
            if sys.__stderr__:
                sys.__stderr__.write(f"[Logger Error] Failed to open {self.log_file}: {e}\n")

    def _rotate_if_needed(self):
        try:
            if self.log_file.exists() and self.log_file.stat().st_size >= self.max_bytes:
                # Close current file handle before renaming (crucial on Windows)
                if self._file and not self._file.closed:
                    self._file.flush()
                    self._file.close()
                    self._file = None

                # Shift existing backups: .4 -> .5, .3 -> .4, etc.
                for i in range(self.backup_count - 1, 0, -1):
                    src = self.log_file.parent / f"{self.log_file.name}.{i}"
                    dst = self.log_file.parent / f"{self.log_file.name}.{i + 1}"
                    if src.exists():
                        if dst.exists():
                            try:
                                dst.unlink(missing_ok=True)
                            except Exception:
                                pass
                        try:
                            src.rename(dst)
                        except Exception:
                            pass

                # Move active file to .1
                first_backup = self.log_file.parent / f"{self.log_file.name}.1"
                if first_backup.exists():
                    try:
                        first_backup.unlink(missing_ok=True)
                    except Exception:
                        pass
                if self.log_file.exists():
                    try:
                        self.log_file.rename(first_backup)
                    except Exception:
                        pass

                self._ensure_file_open()
        except Exception as e:
            if sys.__stderr__:
                sys.__stderr__.write(f"[Logger Rotation Error] {e}\n")
            self._ensure_file_open()

    def write(self, text: str):
        with self.lock:
            # Strip ANSI color codes for clean plain-text log files
            clean_text = ANSI_REGEX.sub('', text)
            if not clean_text:
                return

            self._rotate_if_needed()
            self._ensure_file_open()

            if self._file and not self._file.closed:
                try:
                    self._file.write(clean_text)
                    self._file.flush()
                except Exception:
                    pass

    def flush(self):
        with self.lock:
            if self._file and not self._file.closed:
                try:
                    self._file.flush()
                except Exception:
                    pass

    def clear(self):
        with self.lock:
            if self._file and not self._file.closed:
                try:
                    self._file.flush()
                    self._file.close()
                except Exception:
                    pass
                self._file = None

            try:
                with open(self.log_file, "w", encoding="utf-8", errors="replace") as f:
                    f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Log file cleared by user.\n")
            except Exception as e:
                if sys.__stderr__:
                    sys.__stderr__.write(f"[Logger Clear Error] {e}\n")
            finally:
                self._ensure_file_open()


class TeeStream:
    """Wraps a standard stream (stdout/stderr) to write to both the original stream and the LogWriter."""

    def __init__(self, original_stream, log_writer: RotatingLogWriter, is_stderr: bool = False):
        self.original_stream = original_stream
        self.log_writer = log_writer
        self.is_stderr = is_stderr
        self.encoding = "utf-8"

    def write(self, data):
        # 1. Forward to original console stream
        if self.original_stream:
            try:
                self.original_stream.write(data)
                self.original_stream.flush()
            except Exception:
                pass

        # 2. Forward to log writer (continuous real-time recording)
        if data:
            try:
                self.log_writer.write(data)
            except Exception:
                pass

    def flush(self):
        if self.original_stream:
            try:
                self.original_stream.flush()
            except Exception:
                pass
        try:
            self.log_writer.flush()
        except Exception:
            pass

    def isatty(self):
        if self.original_stream and hasattr(self.original_stream, 'isatty'):
            try:
                return self.original_stream.isatty()
            except Exception:
                return False
        return False

    def fileno(self):
        if self.original_stream and hasattr(self.original_stream, 'fileno'):
            return self.original_stream.fileno()
        raise io.UnsupportedOperation("fileno")

    def reconfigure(self, **kwargs):
        if self.original_stream and hasattr(self.original_stream, 'reconfigure'):
            try:
                self.original_stream.reconfigure(**kwargs)
            except Exception:
                pass

    def __getattr__(self, name):
        return getattr(self.original_stream, name)


# Global log writer instance
log_writer = RotatingLogWriter(LOG_FILE)
_initialized = False


def init_logging():
    """Initializes stdout/stderr interception and hooks Uvicorn/Python logging."""
    global _initialized
    if _initialized:
        return
    _initialized = True

    # 1. Reconfigure original standard streams to UTF-8
    if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        except Exception:
            pass
    if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
        try:
            sys.stderr.reconfigure(encoding='utf-8', errors='replace')
        except Exception:
            pass

    # 2. Attach TeeStream to sys.stdout and sys.stderr
    sys.stdout = TeeStream(sys.__stdout__ or sys.stdout, log_writer, is_stderr=False)
    sys.stderr = TeeStream(sys.__stderr__ or sys.stderr, log_writer, is_stderr=True)

    # 3. Configure standard logging formatters and handlers
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        handlers=[logging.StreamHandler(sys.stdout)]
    )


def get_recent_logs(lines: int = 250, filter_query: Optional[str] = None) -> Dict[str, Any]:
    """Reads the most recent log lines efficiently with metadata."""
    if not LOG_FILE.exists():
        return {
            "logs": "",
            "lines": [],
            "count": 0,
            "total_lines": 0,
            "file_path": str(LOG_FILE),
            "size_kb": 0.0,
            "file_size_human": "0 B",
            "backups": [],
            "updated_at": None,
            "status": "ok"
        }

    try:
        log_writer.flush()
        file_size = LOG_FILE.stat().st_size
        mtime = LOG_FILE.stat().st_mtime

        # Format human readable size
        if file_size < 1024:
            size_human = f"{file_size} B"
        elif file_size < 1024 * 1024:
            size_human = f"{file_size / 1024:.1f} KB"
        else:
            size_human = f"{file_size / (1024 * 1024):.1f} MB"

        # List existing backups
        backups = [
            f.name for i in range(1, BACKUP_COUNT + 1)
            if (f := LOGS_DIR / f"{LOG_FILE.name}.{i}").exists()
        ]

        # Read last N lines using a deque buffer for memory safety
        total_lines = 0
        collected_lines = deque(maxlen=min(max(lines, 1), 5000))
        
        with open(LOG_FILE, "r", encoding="utf-8", errors="replace") as f:
            for raw_line in f:
                total_lines += 1
                line = raw_line.rstrip("\r\n")
                if filter_query:
                    if filter_query.lower() in line.lower():
                        collected_lines.append(line)
                else:
                    collected_lines.append(line)

        lines_list = list(collected_lines)
        return {
            "logs": "\n".join(lines_list),
            "lines": lines_list,
            "count": len(lines_list),
            "total_lines": total_lines,
            "file_path": str(LOG_FILE),
            "size_kb": round(file_size / 1024, 1),
            "file_size_human": size_human,
            "backups": backups,
            "updated_at": mtime,
            "status": "ok"
        }
    except Exception as e:
        return {
            "logs": f"[Log Retrieval Error] {e}",
            "lines": [f"[Log Retrieval Error] {e}"],
            "count": 1,
            "total_lines": 0,
            "file_path": str(LOG_FILE),
            "size_kb": 0.0,
            "file_size_human": "0 B",
            "backups": [],
            "updated_at": None,
            "status": "error",
            "error": str(e)
        }


def clear_logs() -> Dict[str, Any]:
    """Safely clears the active log file."""
    try:
        log_writer.clear()
        return {
            "status": "success",
            "message": "Logs cleared",
            "file_path": str(LOG_FILE)
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to clear log file: {e}",
            "file_path": str(LOG_FILE)
        }
