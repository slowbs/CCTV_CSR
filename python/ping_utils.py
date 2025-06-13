import subprocess
import platform
import time

def ping_device(ip, timeout_seconds=2, log_callback=None):
    """Pings the device at the given IP address and returns True if successful, False otherwise."""
    # If no log_callback is provided, default to print for console debugging
    if log_callback is None:
        log_callback = print

    if not ip:
        log_callback(f"DEBUG PING: IP address is empty for ping_device. Skipping ping.")
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

    # Minimal logging for command execution if needed, or remove if too verbose
    # log_callback(f"Pinging IP {ip} with command: {' '.join(command)}")

    try:
        # subprocess's own timeout, should be slightly greater than ping's internal timeout
        process_timeout = timeout_seconds + 1

        result = subprocess.run(command,
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                creationflags=creationflags, timeout=process_timeout,
                                text=True, # Decode stdout/stderr as text
                                check=False) # Do not raise CalledProcessError on non-zero exit

        # Removed detailed STDOUT/STDERR logging for normal operation
        # log_callback(f"DEBUG PING RESULT: IP={ip}, RC={result.returncode}")
        # if result.stdout and result.stdout.strip():
        #     log_callback(f"DEBUG PING STDOUT for {ip}:\n{result.stdout.strip()}")
        # else:
        #     log_callback(f"DEBUG PING STDOUT for {ip}: [EMPTY]")
        # if result.stderr and result.stderr.strip():
        #     log_callback(f"DEBUG PING STDERR for {ip}:\n{result.stderr.strip()}")
        # else:
        #     log_callback(f"DEBUG PING STDERR for {ip}: [EMPTY]")

        # Default success is based on return code
        is_success = (result.returncode == 0)

        # For Windows, be more stringent: check if the reply is actually from the target IP
        # and not a "Destination host unreachable" from a gateway.
        if system == 'windows' and is_success:
            if f"Reply from {ip}:" not in result.stdout:
                is_success = False # Mark as failed if the reply isn't directly from the target IP
                # Optional: log this specific override condition if still desired for some cases
                # log_callback(f"INFO: IP {ip} (RC=0) overridden to Failed due to indirect reply (e.g., 'Destination host unreachable').")

        return is_success
    except subprocess.TimeoutExpired:
        # Log only the timeout event, not the full command unless necessary for debugging
        log_callback(f"ERROR: Ping to {ip} timed out after {process_timeout}s (subprocess timeout).")
        return False
    except (subprocess.CalledProcessError, OSError) as e:
        log_callback(f"ERROR: OS error pinging {ip}: {e}")
        return False
    except Exception as e:
        log_callback(f"ERROR: Unexpected error pinging {ip}: {e}")
        return False
