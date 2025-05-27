import subprocess
import platform
import time

def ping_device(ip, timeout_seconds=2):
    """Pings the device at the given IP address and returns True if successful, False otherwise."""
    if not ip:
        return False

    system = platform.system().lower()
    if system == 'windows':
        param_count = '-n'
        param_timeout_flag = '-w'
        param_timeout_value = str(int(timeout_seconds * 1000)) # Milliseconds
    else: # Linux, macOS, etc.
        param_count = '-c'
        param_timeout_flag = '-W' # Seconds for -W on Linux ping
        param_timeout_value = str(timeout_seconds) # Seconds

    creationflags = subprocess.CREATE_NO_WINDOW if system == 'windows' else 0
    command = ['ping', param_count, '1', param_timeout_flag, param_timeout_value, ip]

    try:
        result = subprocess.run(command,
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                creationflags=creationflags, timeout=timeout_seconds)
        return result.returncode == 0
    except subprocess.TimeoutExpired:
        print(f"Ping to {ip} timed out after {timeout_seconds}s (subprocess timeout).")
        return False
    except (subprocess.CalledProcessError, OSError) as e:
        print(f"OS error pinging {ip} with command '{' '.join(command)}': {e}")
        return False
    except Exception as e:
        print(f"An unexpected error occurred while pinging {ip} with command '{' '.join(command)}': {e}")
        return False
