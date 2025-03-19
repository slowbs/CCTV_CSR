import subprocess
import platform
import time

def ping_device(ip, timeout_seconds=2):
    """Pings the device at the given IP address and returns True if successful, False otherwise."""
    if not ip:
        return False

    param_count = '-n' if platform.system().lower() == 'windows' else '-c'
    param_timeout = '-w' if platform.system().lower() == 'windows' else '-W'
    creationflags = subprocess.CREATE_NO_WINDOW if platform.system().lower() == 'windows' else 0

    try:
        result = subprocess.run(['ping', param_count, '1', param_timeout, str(int(timeout_seconds * 1000)), ip],
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                creationflags=creationflags, timeout=timeout_seconds)
        return result.returncode == 0
    except subprocess.TimeoutExpired:
        print(f"Ping to {ip} timed out.")
        return False
    except (subprocess.CalledProcessError, OSError) as e:
        print(f"Error pinging {ip}: {e}")
        return False
    except Exception as e:
        print(f"An unexpected error occurred while pinging {ip}: {e}")
        return False
