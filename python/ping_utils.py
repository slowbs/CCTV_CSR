import subprocess
import platform

def ping_device(ip):
    """Pings the device at the given IP address and returns True if successful, False otherwise."""
    if not ip:
        return False

    param_count = '-n' if platform.system().lower() == 'windows' else '-c'
    param_timeout = '-w' if platform.system().lower() == 'windows' else '-W'
    creationflags = subprocess.CREATE_NO_WINDOW if platform.system().lower() == 'windows' else 0

    result = subprocess.run(['ping', param_count, '1', param_timeout, '500', ip],
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                            creationflags=creationflags)
    return result.returncode == 0
